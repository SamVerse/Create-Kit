import { useState } from "react";
import Markdown from "react-markdown";
import { downloadImage } from "../utils/downloadImage";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import toast from "react-hot-toast";

interface CreationItemProps {
  item: {
    id: number;
    user_id: string;
    prompt: string;
    content: string;
    type: string;
    publish: boolean;
    likes: any[];
    created_at: string;
    updated_at: string;
  };
  onPublishToggled?: () => void;
}

const CreationItem = ({ item, onPublishToggled }: CreationItemProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const { getToken } = useAuth();
  const [publish, setPublish] = useState<boolean>(item.publish ?? false);

  const handlePublishToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      // optimistic UI
      const newPublish = !publish;
      setPublish(newPublish);

      const { data } = await axios.post(
        "/api/user/toggle-publish-creation",
        { creationId: item.id, publish: newPublish },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!data?.success) {
        setPublish(!newPublish);
        toast.error(data?.message || "Failed to update publish state");
      } else {
        toast.success(newPublish ? "Published" : "Unpublished");
        if (onPublishToggled) onPublishToggled();
      }
    } catch (err: any) {
      setPublish(!publish);
      toast.error(err?.message || "Failed to update publish state");
    }
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg cursor-pointer"
    >
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2>{item.prompt}</h2>
          <p className="text-gray-500">
            {item.type} - {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-1 rounded-full"
        >
          {item.type}
        </button>
      </div>
      {expanded && (
        <div>
          {item.type === "image" ? (
            <div>
              <img
                src={item.content}
                alt="image"
                className="mt-3 w-full max-w-md"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(item.content, `ai-image-${item.id}.png`);
                  }}
                  className="mt-4 w-full flex justify-center items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800"
                >
                  Download Image
                </button>

                <button
                  onClick={handlePublishToggle}
                  className={`mt-2 w-full flex justify-center items-center gap-2 ${publish ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-200 hover:bg-gray-300'} text-white px-4 py-2 rounded-lg text-sm`}
                >
                  {publish ? 'Unpublish' : 'Publish to Public'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 h-full overflow-y-scroll text-sm text-slate-700 ">
              <div className="reset-tw">
                <Markdown>{item.content}</Markdown>
            </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreationItem;
