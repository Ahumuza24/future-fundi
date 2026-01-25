import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

interface Stat {
    value: string;
    label: string;
}

const stats: Stat[] = [
    { value: "60,000+", label: "Learners" },
    { value: "500+", label: "Schools" },
    { value: "8", label: "Countries" },
    { value: "6-21", label: "Age Range" },
];

export const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-[90vh] flex items-center pt-16">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B35]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#00C4B4]/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C7F464]/5 rounded-full blur-3xl" />

                {/* Decorative dots */}
                <svg className="absolute inset-0 w-full h-full opacity-30" style={{ zIndex: 0 }}>
                    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1.5" fill="#FF6B35" opacity="0.3" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="text-center"
                >
                    {/* Badge */}
                    <motion.div
                        variants={fadeInUp}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200 shadow-sm text-gray-600 text-sm font-medium mb-8 hover:bg-white/80 transition-colors cursor-default"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-[#FF6B35]"></span>
                        Empowering the Next Generation of Makers
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1
                        variants={fadeInUp}
                        className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight"
                    >
                        Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF8C61]">Young Minds</span>
                        <br />
                        Grow Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C4B4] via-[#2DD4BF] to-[#C7F464]">Makers</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        variants={fadeInUp}
                        className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light"
                    >
                        Future Fundi transforms weekly <span className="font-semibold text-gray-900">STEM learning</span> into verified skills,
                        micro-credentials, and career pathways for learners across East Africa.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <Button
                            size="lg"
                            onClick={() => navigate("/login")}
                            className="text-lg px-8 py-6 bg-[#FF6B35] hover:bg-[#E85A24] text-white rounded-full"
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 py-6 rounded-full border-2 border-gray-300 hover:border-[#FF6B35] hover:text-[#FF6B35]"
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Watch Demo
                        </Button>
                    </motion.div>

                    {/* Stats Row */}
                    <motion.div
                        variants={fadeInUp}
                        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
                    >
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <p className="text-3xl md:text-4xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2"
                >
                    <div className="w-1.5 h-3 bg-gray-400 rounded-full" />
                </motion.div>
            </motion.div>
        </section>
    );
};
