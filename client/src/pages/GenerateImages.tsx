import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Hash, Image, Sparkles } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { downloadImage } from "../utils/downloadImage";

// Set base URL for axios so we don't have to repeat it in every request
axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const GenerateImages = () => {
  const ImageStyle = [
    "Realistic",
    "Ghibli style",
    "Anime style",
    "Cartoon style",
    "Fantasy style",
    "Realistic style",
    "Portrait style",
    "Pixel style",
    "3D style",
  ];

  const [selectedStyle, setSelectedStyle] = useState<(typeof ImageStyle)[0]>(
    ImageStyle[0],
  );
  const [input, setInput] = useState<string>("");
  const [publish, setPublish] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const prompt = `Generate an image in the following style: ${selectedStyle} for the description: ${input}`;

      // API call to backend with prompt, length and auth token to generate article content
      const { data } = await axios.post(
        "/api/ai/generate-image",
        { prompt, publish },
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
          data.message || "Failed to generate image. Please try again.",
        );
      }
      setLoading(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          "An error occurred while generating the image. Please try again.",
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
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

        <p className="mt-6 text-sm font-medium">
          Describe the image you want to generate
        </p>

        <textarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          className="w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 rounded-md"
          rows={4}
          placeholder="Describe what you want to see in the image..."
          required
        />

        <p className="mt-4 text-sm font-medium">Style</p>

        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {ImageStyle.map((item) => (
            <span
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedStyle === item ? "bg-green-50 text-green-700" : "text-gray-500 border-gray-300"}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              aria-label="Make this image public"
              type="checkbox"
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className="sr-only peer"
            />

            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>
            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
          </label>
          <p className="text-sm">Make this image public</p>
        </div>

        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 rounded-lg text-sm mt-6 cursor-pointer hover:bg-linear-to-r hover:from-[#02CC37] hover:to-[#03D140]"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Image className="w-5" />
          )}
          Generate Image
        </button>
      </form>

      {/* right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 ">
        <div className="flex items-center gap-3">
          <Hash className="w-5 h-5 text-[#8E37EB]" />
          <h1 className="text-xl font-semibold">Generated Titles</h1>
        </div>

        {!content ? (
          loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-4 text-gray-500">
                <span className="w-12 h-12 rounded-full border-4 border-t-transparent border-gray-300 animate-spin" />
                <p className="text-center">Generating image... this may take some time.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <Hash className="w-9 h-9" />
                <p className="text-center">
                  Enter a topic and click "Generate Title" to get started.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="mt-3 h-full">
            <img
              src={content}
              alt="Generated Image"
              className="w-full h-full"
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
            
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateImages;
