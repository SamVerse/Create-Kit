import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { FileText, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Markdown from "react-markdown";

// Set base URL for axios so we don't have to repeat it in every request
axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const ReviewResume = () => {
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!file) {
        toast.error("Please upload a resume to review.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("resume", file);
      // API call to backend with prompt, length and auth token to generate article content
      const { data } = await axios.post("/api/ai/resume-review", formData, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success === true) {
        setContent(data.content);
      } else {
        toast.error(
          data.message || "Failed to review resume. Please try again.",
        );
      }
      setLoading(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          "An error occurred while reviewing the resume. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* left col */}
      <form
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
        onSubmit={onSubmitHandler}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Resume Review</h1>
        </div>
        <p className="mt-6 text-sm font-medium">
          Upload your resume for AI-powered review and suggestions
        </p>

        <input
          aria-label="Upload Resume"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          type="file"
          accept="application/pdf"
          className="w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 rounded-md text-gray-600"
          required
        />

        <p className="text-xs text-gray-500 font-light mt-1">
          Supports PDF format only
        </p>

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 rounded-lg text-sm mt-6 cursor-pointer hover:bg-linear-to-r hover:from-[#00BFA1] hover:to-[#007F8F]"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <FileText className="w-5" />
          )}
          Review Resume
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-150">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Analysis Results</h1>
        </div>

        {!content ? (
          loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-4 text-gray-500">
                <span className="w-12 h-12 rounded-full border-4 border-t-transparent border-gray-300 animate-spin" />
                <p className="text-center">Reviewing resume... this may take a moment.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <FileText className="w-9 h-9" />
                <p className="text-center">
                  Upload a resume and click "Review Resume" to see the analysis
                  results here.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="mt-3 h-full overflow-y-scroll text-sm text-slate-600">
            <div className="reset-tw">
              <Markdown>{content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewResume;
