import { useEffect, useState } from 'react'
import { Gem, Sparkles } from 'lucide-react';
import { Protect, useAuth } from '@clerk/clerk-react';
import CreationItem from '../components/CreationItem';
import axios from 'axios';
import toast from 'react-hot-toast';

// Set base URL for axios so we don't have to repeat it in every request
axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

interface Creation {
  id: number;
  user_id: string;
  prompt: string;
  content: string;
  type: string;
  publish: boolean;
  likes: any[];
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {

  const [creations, setCreations] = useState<Creation[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const {getToken} = useAuth();

  const getDashboardData = async () => {
    try {
      const { data } = await axios.get(
        "/api/user/get-user-creations",
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

  useEffect(() => {
    getDashboardData();
  }, []);

  return (
    <div className='h-full overflow-y-scroll p-6 '>
      <div className='flex justify-start gap-4 flex-wrap'>
        {/* Total Creations card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{creations.length}</h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-linear-to-br from-[#3588F2] to-[#0BB0D7] text-white flex items-center justify-center'>
            <Sparkles className='w-5 text-white' />
          </div>
        </div>

        {/* Active Plan card */}
        <div className='flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200'>
          <div className='text-slate-600'>
            <p className='text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'>
              <Protect plan={"premium"} fallback={"free"} >
                Premium 
              </Protect>
            </h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-linear-to-br from-[#FF61C5] to-[#9E53EE] text-white flex items-center justify-center'>
            <Gem className='w-5 text-white' />
          </div>
        </div>
      </div>

      {
        loading ? (
          <div className='flex justify-center items-center h-3/4'>
            <div className='animate-spin rounded-full h-11 w-11 border-3 border-purple-500 border-t-transparent'></div> 
          </div>
        ) : (
          <div className='space-y-3'>
            <p className='mt-6 mb-4'>Recent Creations</p>
            {creations.length === 0 ? (
              <div className='flex flex-col items-center justify-center w-full h-96 p-12'>
                <div className='bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 mb-4'>
                  <svg xmlns="http://www.w3.org/2000/svg" className='h-12 w-12 text-blue-500' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5zm0-10l9-5-9-5-9 5 9 5z" />
                  </svg>
                </div>
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>No creations yet</h3>
                <p className='text-gray-500 mb-4'>Start creating and your works will appear here!</p>
              </div>
            ) : (
              creations.map((item) => <CreationItem key={item.id} item={item} onPublishToggled={getDashboardData} />)
            )}
          </div>
        )
      }
      

    </div>
  )
}

export default Dashboard