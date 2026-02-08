import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Hash, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Markdown from "react-markdown";

// Set base URL for axios so we don't have to repeat it in every request
axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const BlogTitles = () => {
  const blogCategories = [
    "General",
    "Technology",
    "Health",
    "Finance",
    "Travel",
    "Food",
    "Lifestyle",
    "Education",
    "Entertainment",
    "Sports",
  ];

  const [selectedCategory, setSelectedCategory] = useState<
    (typeof blogCategories)[0]
  >(blogCategories[0]);
  const [input, setInput] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const prompt = `You are an expert writer. Generate a catchy blog title for the following keyword: ${input} in the category of ${selectedCategory}.`;

      // API call to backend with prompt, length and auth token to generate article content
      const { data } = await axios.post(
        "/api/ai/generate-blog-title",
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (data.success === true) {
        setContent(data.blogTitle);
      } else {
        toast.error(
          data.message || "Failed to generate blog title. Please try again.",
        );
      }
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.");
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
          <Sparkles className="w-6 text-[#8E37EB]" />
          <h1 className="text-xl font-semibold">AI Title Generator</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Keyword</p>

        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          className="w-full p-2 px-3 mt-2 outline-none text-sm border border-gray-300 rounded-md"
          type="text"
          placeholder="The future of Artifical Intelligence is..."
          required
        />

        <p className="mt-4 text-sm font-medium">Category</p>

        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {blogCategories.map((item) => (
            <span
              onClick={() => setSelectedCategory(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item ? "bg-purple-50 text-purple-700" : "text-gray-500 border-gray-300"}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <br />
        <button
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-linear-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 rounded-lg text-sm mt-6 cursor-pointer hover:bg-linear-to-r hover:from-[#A02ED1] hover:to-[#7A2EB1]"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Hash className="w-5" />
          )}
          Generate Title
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
                <p className="text-center">Generating title... please wait.</p>
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

export default BlogTitles;
