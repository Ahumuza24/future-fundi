import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

export const CTASection = () => {
    const navigate = useNavigate();

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#00C4B4]" />
            <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                    <pattern id="cta-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <circle cx="30" cy="30" r="2" fill="white" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#cta-pattern)" />
                </svg>
            </div>

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                >
                    <motion.h2
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl font-bold text-white mb-6"
                    >
                        Ready to Grow Your Future?
                    </motion.h2>
                    <motion.p
                        variants={fadeInUp}
                        className="text-xl text-white/90 mb-10 max-w-2xl mx-auto"
                    >
                        Join 60,000+ learners across East Africa who are building real skills,
                        earning credentials, and creating career pathways.
                    </motion.p>
                    <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={() => navigate("/login")}
                            className="text-lg px-8 py-6 bg-white text-[#FF6B35] hover:bg-gray-100 rounded-full font-semibold"
                        >
                            Start Learning Today
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 py-6 rounded-full border-2 border-white text-white hover:bg-white/10"
                        >
                            Contact Us
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
