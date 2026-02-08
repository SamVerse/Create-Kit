import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Eraser, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { downloadImage } from "../utils/downloadImage";

// Set base URL for axios so we don't have to repeat it in every request
axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const RemoveBackground = () => {
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!file) {
        toast.error("Please upload an image to process.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      // API call to backend with prompt, length and auth token to generate article content
      const { data } = await axios.post(
        "/api/ai/remove-image-background",
        formData,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (data.success === true) {
        setContent(data.imageUrl);
      } else {
        toast.error(
          data.message || "Failed to remove background. Please try again.",
        );
      }
      setLoading(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          "An error occurred while removing the background. Please try again.",
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
          <Sparkles className="w-6 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Background Removal</h1>
        </div>
        <p className="mt-6 text-sm font-medium">
          Upload an image to remove its background
        </p>

        <input
          aria-label="Upload Image"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          type="file"
          accept="image/*"
          className="w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 rounded-md text-gray-600"
          required
        />

        <p className="text-xs text-gray-500 font-light mt-1">
          Supports JPG, PNG and other image formats
        </p>

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 rounded-lg text-sm mt-6 cursor-pointer hover:bg-linear-to-r hover:from-[#D17A2A] hover:to-[#E03A1F]"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Eraser className="w-5" />
          )}
          Remove Background
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 ">
        <div className="flex items-center gap-3">
          <Eraser className="w-5 h-5 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Processed Image</h1>
        </div>

        {!content ? (
          loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-4 text-gray-500">
                <span className="w-12 h-12 rounded-full border-4 border-t-transparent border-gray-300 animate-spin" />
                <p className="text-center">Removing background... this may take a moment.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <Eraser className="w-9 h-9" />
                <p className="text-center">
                  Upload an image and click "Remove Background" to see the
                  processed result here.
                </p>
              </div>
            </div>
          )
        ) : (
          <>
            <img src={content} alt="Processed" className="mt-3 w-full h-full" />
            <button
              onClick={() => downloadImage(content, `ai-image-${Date.now()}.png`)}
              className="mt-4 w-full flex justify-center items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800"
            >
              Download Image
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RemoveBackground;
