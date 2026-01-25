import { useState } from "react";
import { motion } from "framer-motion";
import { TreeDeciduous, Target, MessageCircle, BarChart3, Award, Star } from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

interface Feature {
    icon: typeof TreeDeciduous;
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        icon: TreeDeciduous,
        title: "Growth Tree",
        description: "Visual learning journey that grows with every achievement",
    },
    {
        icon: Target,
        title: "Pathway Scoring",
        description: "Smart algorithm measures readiness for next steps",
    },
    {
        icon: MessageCircle,
        title: "Parent Updates",
        description: "Weekly WhatsApp tiles keep families connected",
    },
    {
        icon: BarChart3,
        title: "Impact Dashboards",
        description: "Real-time analytics for teachers and leaders",
    },
];

export const FeaturesSection = () => {
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

    return (
        <section id="features" className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left - Text */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                    >
                        <motion.span
                            variants={fadeInUp}
                            className="text-[#00C4B4] font-semibold uppercase tracking-wide text-sm"
                        >
                            Platform Features
                        </motion.span>
                        <motion.h2
                            variants={fadeInUp}
                            className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6"
                        >
                            Everything You Need to<br />
                            <span className="text-[#FF6B35]">Track & Celebrate</span> Growth
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="text-xl text-gray-600 mb-8"
                        >
                            Future Fundi connects learners, parents, teachers, and school leaders
                            with tools designed for hands-on STEM education.
                        </motion.p>

                        <motion.div variants={staggerContainer} className="space-y-6">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        variants={fadeInUp}
                                        onMouseEnter={() => setHoveredFeature(index)}
                                        onMouseLeave={() => setHoveredFeature(null)}
                                        className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer ${hoveredFeature === index ? 'bg-[#FF6B35]/10 scale-105' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                                            <Icon className="h-6 w-6 text-[#FF6B35]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                                            <p className="text-gray-600">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </motion.div>

                    {/* Right - Decorative */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#FF6B35] via-[#00C4B4] to-[#C7F464] p-1 shadow-2xl">
                            <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#00C4B4] flex items-center justify-center">
                                        <TreeDeciduous className="h-16 w-16 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Growth Tree</h3>
                                    <p className="text-gray-600">Watch your skills branch out and flourish</p>

                                    {/* Mock metrics */}
                                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                                        <div className="bg-[#FF6B35]/10 rounded-xl p-3">
                                            <p className="text-2xl font-bold text-[#FF6B35]">85</p>
                                            <p className="text-xs text-gray-500">Pathway Score</p>
                                        </div>
                                        <div className="bg-[#00C4B4]/10 rounded-xl p-3">
                                            <p className="text-2xl font-bold text-[#00C4B4]">12</p>
                                            <p className="text-xs text-gray-500">Artifacts</p>
                                        </div>
                                        <div className="bg-[#C7F464]/20 rounded-xl p-3">
                                            <p className="text-2xl font-bold text-[#7CB518]">3</p>
                                            <p className="text-xs text-gray-500">Credentials</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating badges */}
                        <motion.div
                            animate={{ y: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="absolute -top-4 -right-4 bg-white shadow-lg rounded-xl p-3 flex items-center gap-2"
                        >
                            <Award className="h-5 w-5 text-[#FF6B35]" />
                            <span className="text-sm font-medium">New Credential!</span>
                        </motion.div>

                        <motion.div
                            animate={{ y: [5, -5, 5] }}
                            transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                            className="absolute -bottom-4 -left-4 bg-white shadow-lg rounded-xl p-3 flex items-center gap-2"
                        >
                            <Star className="h-5 w-5 text-[#00C4B4]" />
                            <span className="text-sm font-medium">Gate: GREEN</span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
