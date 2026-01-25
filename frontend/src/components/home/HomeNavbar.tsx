import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HomeNavbar = () => {
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 sm:gap-3">
                        <img
                            src="/fundi_bots_logo.png"
                            alt="Fundi Bots"
                            className="h-8 w-auto sm:h-10 transition-all"
                        />
                        <span className="font-bold text-lg sm:text-xl text-gray-900 hidden sm:block">Future Fundi</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#journey" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
                        <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                        <a href="#portals" className="text-gray-600 hover:text-gray-900 transition-colors">Portals</a>
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/login")}
                            className="text-gray-700 hover:text-gray-900 px-2 sm:px-4 text-sm sm:text-base"
                        >
                            Log In
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => navigate("/signup")}
                            className="bg-[#FF6B35] hover:bg-[#E85A24] text-white rounded-full px-4 sm:px-6 text-sm sm:text-base h-9 sm:h-10"
                        >
                            Get Started
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
