import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Set base URL for axios so we don't have to repeat it in every request
axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const Community = () => {

  const [creations, setCreations] = useState<Array<any>>([]);
  const {user} = useUser();

  const [loading, setLoading] = useState<boolean>(true);
  const { getToken } = useAuth();

  const fetchedCreations = async () => {
    try {
      const { data } = await axios.get(
        "/api/user/get-published-creations",
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (data.success === true) {
        setCreations(data.creations);
        setLoading(false);
      } else {
        toast.error(
          data.message || "Failed to fetch creations. Please try again.",
        );
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while fetching creations. Please try again.");
      setLoading(false);
    }
  }

  const imageLikeHandler = async (creationId: string) => {
    try {
      const { data } = await axios.post(
        `/api/user/toggle-like-creation/${creationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          }
        },
      );

      if (data.success === true) {
        toast.success(data.message || "Successfully liked the creation.");
        await fetchedCreations();
      } else {
        toast.error(
          data.message || "Failed to like the creation. Please try again.",
        );  
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while liking the creation. Please try again.");
      
    }
  }

  useEffect(() => {
    if(user){
      fetchedCreations();
    }
  }, [user]);

  return loading ? (
    <div className='flex justify-center items-center h-full'>
      <span className='w-10 h-10 my-1 rounded-full border-3 border-primary border-t-transparent animate-spin'></span>
    </div>
  ) : (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <h2 className='text-2xl font-bold mb-4'>Creations</h2>
      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll flex items-center justify-center'>
        {creations.length === 0 ? (
          <div className='flex flex-col items-center justify-center w-full h-full p-12'>
            <div className='bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 mb-4'>
              <svg xmlns="http://www.w3.org/2000/svg" className='h-12 w-12 text-blue-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5zm0-10l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-700 mb-2'>No community posts yet</h3>
            <p className='text-gray-500 mb-4'>Be the first to share your creation and inspire others!</p>
            {/* Optionally, add a button to create/post */}
          </div>
        ) : (
          creations.map((creation, index) => (
            <div key={index} className='relative group inline-block pl-3 w-full sm:max-w-1/2 lg:max-w-1/3'>
              <img src={creation.content} alt={creation.title} className='w-full h-full object-cover rounded-lg' />
              <div className='absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-linear-to-b from-transparent to-black/80 text-white rounded-lg'>
                <p className='text-sm hidden group-hover:block'>{creation.prompt}</p>
                <div className='flex gap-1 items-center'>
                  <p>{creation.likes.length}</p>
                  <Heart onClick={() => imageLikeHandler(creation.id)} className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${creation.likes.includes(user?.id) ? 'fill-red-500 text-red-600' : 'text-white'}`} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Community