import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Scissors, Sparkles } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { downloadImage } from "../utils/downloadImage";

// Set base URL for axios so we don't have to repeat it in every request
axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const RemoveObject = () => {
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  const { getToken } = useAuth();

  const [object, setObject] = useState<string>("");

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (object.split(" ").length > 1) {
        toast.error("Only single object name is supported");
        setLoading(false);
        return;
      }

      if (!file) {
        toast.error("Please upload an image to process.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("object", object);

      // API call to backend with prompt, length and auth token to generate article content
      const { data } = await axios.post(
        "/api/ai/remove-image-object",
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
          data.message || "Failed to remove object. Please try again.",
        );
      }

      setLoading(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          "An error occurred while removing the object. Please try again.",
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
          <Sparkles className="w-6 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Object Removal</h1>
        </div>

        <p className="mt-6 text-sm font-medium">
          Upload an image to remove an object
        </p>

        <input
          aria-label="Upload Image"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          type="file"
          accept="image/*"
          className="w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 rounded-md text-gray-600"
          required
        />

        <p className="mt-6 text-sm font-medium">
          Describe object name to remove
        </p>

        <textarea
          onChange={(e) => setObject(e.target.value)}
          value={object}
          className="w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 rounded-md"
          rows={4}
          placeholder="e.g., watch or spoon , Only single object name is supported"
          required
        />

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 rounded-lg text-sm mt-6 cursor-pointer hover:bg-linear-to-r hover:from-[#315FCC] hover:to-[#6C2EB5]"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Scissors className="w-5" />
          )}
          Remove Object
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 ">
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Processed Image</h1>
        </div>

        {!content ? (
          loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-4 text-gray-500">
                <span className="w-12 h-12 rounded-full border-4 border-t-transparent border-gray-300 animate-spin" />
                <p className="text-center">Removing object... this may take a moment.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <Scissors className="w-9 h-9" />
                <p className="text-center">
                  Upload an image and click "Remove Object" to see the processed
                  result here.
                </p>
              </div>
            </div>
          )
        ) : (
          <>
            <img
              src={content}
              alt="Processed"
              className="w-full mt-3 h-full object-contain"
            />
           {
              loading ? (
                <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
              ) : (
                <button
                  onClick={() => downloadImage(content, `ai-image-${Date.now()}.png`)}
                  className="mt-4 w-full flex justify-center items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800"
                >
                  Download Image
                </button>
              )
            }
          </>
        )}
      </div>
    </div>
  );
};

export default RemoveObject;
