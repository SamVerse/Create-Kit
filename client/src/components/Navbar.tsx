import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets.ts";
import { ArrowRightIcon } from "lucide-react";
import { useUser, UserButton, useClerk } from "@clerk/clerk-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { openSignIn } = useClerk();

  return (
    <div className="fixed z-5 w-full backdrop-blur-2xl flex justify-between items-center  px-4 py-3 sm:px-20 xl:px-32">
      <div
        onClick={() => navigate("/")}
        className="flex items-center justify-center gap-2 cursor-pointer"
      >
        <img src={assets.logo} alt="Logo" className="h-10" />
        <span className="text-2xl font-bold text-[#5044E5]">CreateKit</span>
      </div>

      {user ? (
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openSignIn()}
          className="flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary 
        text-white px-10 py-2.5"
        >
          Get Started
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Navbar;
