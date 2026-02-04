export const HomeFooter = () => {
    return (
        <footer className="bg-gray-900 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/fundi_bots_logo.png"
                            alt="Fundi Bots"
                            className="h-10 w-auto"
                        />
                        <div>
                            <p className="text-white font-semibold">Future Fundi</p>
                            <p className="text-gray-400 text-sm">Powered by Fundi Bots</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 text-gray-400 text-sm">
                        <a href="#" className="hover:text-white transition-colors">About</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2026 Fundi Bots. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
