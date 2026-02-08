import { clerkClient, getAuth } from "@clerk/express";
import { Request, Response } from "express";
import {OpenAI} from "openai";
import sql from "../configs/db.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Initialize OpenAI client for Gemini
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { prompt, length } = req.body;

    const plan = req.plan; // 'free' or 'premium'
    const free_usage = req.free_usage || 0;

    // Check if plan is free and usage limit is reached
    if (plan != "premium" && free_usage >= 10) {
      return res.status(403).json({
        error: "Free plan usage limit reached. Please upgrade to premium.",
      });
    }

    // Interpret `length` as approximate desired word count from the client.
    // We give the model *extra* token headroom so it can naturally stop
    // around that length instead of hitting the hard max.
    const desiredWords =
      typeof length === "number" && Number.isFinite(length) && length > 0
        ? length
        : 400;

    // More generous conversion: ~3 tokens per desired word, with a higher
    // minimum and an upper cap. This makes it much more likely the model
    // finishes with finish_reason === "stop" rather than "length".
    const maxTokens = Math.max(
      2048,
      Math.min(8192, Math.round(desiredWords * 3)),
    );

    // Call Gemini to generate the article
    const response = await openai.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: `You are an expert writer. Write a detailed, well-structured article on the following topic: "${prompt}".

          The article should be approximately ${desiredWords} words long (it's okay to be slightly above or below), written in natural paragraphs, and it must fully finish its explanation with a clear concluding paragraph. Do not stop mid-sentence.`,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    // // Optional: log finish_reason for debugging short responses in local dev
    // console.log(
    //   "Article generation finish_reason:",
    //   response.choices[0].finish_reason,
    //   "tokens_used:",
    //   response.usage,
    // );

    const articleContent = response.choices[0].message?.content;

    //  Error handling for missing article content
    if (!articleContent) {
      return res
        .status(500)
        .json({ error: "Failed to generate article content." });
    }

    // Store the generated article in the database
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${articleContent}, 'article')`;

    // Increment free usage count if on free plan
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId!, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.status(200).json({ success: true, article: articleContent });
  } catch (error) {
    console.log("Article generation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Article generation failed." });
  }
};

export const generateBlogTitle = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { prompt } = req.body;

    const plan = req.plan; // 'free' or 'premium'
    const free_usage = req.free_usage || 0;

    // Check if plan is free and usage limit is reached
    if (plan != "premium" && free_usage >= 10) {
      return res.status(403).json({
        error: "Free plan usage limit reached. Please upgrade to premium.",
      });
    }

    // Call Gemini to generate the article
    const response = await openai.chat.completions.create({
      model: "gemini-2.5-flash-lite",
      messages: [
        {
          role: "user",
          content: `${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const blogTitle = response.choices[0].message?.content;

    //  Error handling for missing article content
    if (!blogTitle) {
      return res
        .status(500)
        .json({ error: "Failed to generate article content." });
    }

    // Store the generated article in the database
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${blogTitle}, 'blog-title')`;

    // Increment free usage count if on free plan
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId!, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.status(200).json({ success: true, blogTitle: blogTitle });
  } catch (error) {
    console.log("Blog title generation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Blog title generation failed." });
  }
};

export const generateImage = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { prompt, publish } = req.body;

    const plan = req.plan; // 'free' or 'premium'

    // Check if plan is free and usage limit is reached
    if (plan != "premium") {
      return res.status(403).json({
        error:
          "Image generation is available for premium users only. Please upgrade to premium.",
      });
    }

    
    // Note: Krea's image generation can take time, so we initiate the job and then poll for completion.
    const kreaJobRes = await axios.post(
      "https://api.krea.ai/generate/image/bfl/flux-1-dev",
      {
        prompt,
        width: 1024,
        height: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KREA_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Krea returns a job ID which we can use to poll for the generated image URL
    const jobId = kreaJobRes.data.id || kreaJobRes.data.job_id;

    if (!jobId) {
      console.error("Krea API Response:", kreaJobRes.data);
      return res.status(500).json({ error: "Failed to initiate image generation job." });
    }

    // Poll for status
    let imageUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s
    
    // Keep polling every 2 seconds until we get the image URL or reach max attempts
    while (!imageUrl && attempts < maxAttempts) {
      attempts++;
      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Check job status
      const statusRes = await axios.get(`https://api.krea.ai/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${process.env.KREA_API_KEY}`,
        },
      });

      // Check if the job is completed and has a result
      const jobData = statusRes.data;

      // Krea's response structure may vary, so we check for the presence of the image URL in a few different ways
      if (jobData.completed_at && jobData.result && jobData.result.urls && jobData.result.urls.length > 0) {
        // Assuming the generated image URL is in jobData.result.urls[0]
        imageUrl = jobData.result.urls[0];
      } else if (jobData.status === 'failed') {
        console.error("Krea Job Failed:", jobData);
        throw new Error(`Krea job failed: ${jobData.error || 'Unknown error'}`);
      }
    }

    if (!imageUrl) {
      console.error("Krea Image generation timed out");
      return res.status(504).json({ error: "Image generation timed out." });
    }

    // Upload image to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(imageUrl);

    // Error handling for missing image URL
    if (!secure_url) {
      return res.status(500).json({ error: "Image upload failed." });
    }

    // Store the generated image in the database
    await sql`INSERT INTO creations (user_id, prompt, content, type, publish) VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    res.status(200).json({ success: true, imageUrl: secure_url });
  } catch (error: any) {
    console.error("Image generation error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Image generation failed." });
  }
};

export const removeImageBackground = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const { userId } = getAuth(req);
    const image = req.file;

    const plan = req.plan; // 'free' or 'premium'

    // Check if plan is free
    if (plan != "premium") {
      return res.status(403).json({
        error:
          "Image background removal is available for premium users only. Please upgrade to premium.",
      });
    }

    // Upload image to Cloudinary with background removal effect
    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      effect: "background_removal",
    });

    // Error handling for missing image URL
    if (!secure_url) {
      return res
        .status(500)
        .json({ error: "Image background removal failed." });
    }

    // Store the generated image in the database
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Remove background from image`}, ${secure_url}, 'image')`;

    res.status(200).json({ success: true, imageUrl: secure_url });
  } catch (error) {
    console.log("Image background removal generation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Image background removal failed." });
  }
};

export const removeImageObject = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { object } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const image = req.file;

    const plan = req.plan; // 'free' or 'premium'

    // Check if plan is free
    if (plan != "premium") {
      return res.status(403).json({
        error:
          "Image object removal is available for premium users only. Please upgrade to premium.",
      });
    }

    // Upload image to Cloudinary with background removal effect
    const { public_id } = await cloudinary.uploader.upload(image!.path);

    // Error handling for missing image ID
    if (!public_id) {
      return res.status(500).json({ error: "Image object removal failed." });
    }

    const imageUrl = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`,
        },
      ],
      resource_type: "image",
    });

    // Store the generated image in the database
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Remove ${object} from image`}, ${imageUrl}, 'image')`;

    res.status(200).json({ success: true, imageUrl: imageUrl });
  } catch (error) {
    console.log("Image object removal generation error:", error);
    res
      .status(500)
      .json({ success: false, error: "Image object removal failed." });
  }
};

export const resumeReview = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded" });
    }

    const resume = req.file;

    const plan = req.plan; // 'free' or 'premium'

    // Check if plan is free
    if (plan != "premium") {
      return res.status(403).json({
        error:
          "Resume review is available for premium users only. Please upgrade to premium.",
      });
    }

    if (!resume) {
      return res.status(400).json({ error: "No resume uploaded" });
    }

    // Check file size (e.g., limit to 5MB)
    if (resume?.size! > 5 * 1024 * 1024) {
      return res
        .status(400)
        .json({ success: false, error: "Resume file size exceeds 5MB limit." });
    }

    // Read the uploaded resume file and convert to buffer
    const dataBuffer = fs.readFileSync(resume.path);
    fs.unlinkSync(resume.path); // Delete the file after reading

    // Polyfill minimal DOM classes expected by pdfjs to avoid runtime
    // ReferenceErrors in serverless environments where DOM globals are missing.
    if (typeof (globalThis as any).DOMMatrix === "undefined") {
      (globalThis as any).DOMMatrix = class DOMMatrix {};
    }
    if (typeof (globalThis as any).ImageData === "undefined") {
      (globalThis as any).ImageData = class ImageData {
        constructor() {}
      };
    }
    if (typeof (globalThis as any).Path2D === "undefined") {
      (globalThis as any).Path2D = class Path2D {};
    }

    // Import pdf-parse dynamically after polyfills to avoid the module
    // evaluating code paths that expect DOM globals during top-level import.
    const { PDFParse } = await import("pdf-parse");

    // Parse the PDF to extract text using the v2 API
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }

    // Store the extracted text
    const resumeText = result?.text || "";

    // Error handling for empty resume text
    if (!resumeText || resumeText.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Uploaded resume is empty or could not extract text." });
    }

    const prompt = `
      You are an expert technical recruiter.

      Review the following resume and return your feedback in this structure:

      1. Overall Impression (2–3 sentences)
      2. Strengths (bullet points)
      3. Weaknesses (bullet points)
      4. Suggestions for Improvement (bullet points)
      5. Final Verdict (1 paragraph)

      Be concise but specific.

      Resume:
      ${resumeText}
    `;

    // Call Gemini to review the resume
    const response = await openai.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: `${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1600,
    });

    const content = response.choices[0].message?.content;

    //  Error handling for missing resume review content
    if (!content) {
      return res.status(500).json({ error: "Failed to review resume." });
    }

    // Store the generated resume review in the database
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${`Review the uploaded resume`}, ${content}, 'resume-review')`;

    res.status(200).json({ success: true, content: content });
  } catch (error) {
    console.log("Resume review generation error:", error);
    res.status(500).json({ success: false, error: "Resume review failed." });
  }
};
