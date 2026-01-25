import { motion } from "framer-motion";
import { Sparkles, Zap, Award, Briefcase } from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

interface JourneyStep {
    icon: typeof Sparkles; // Using one icon type as representative
    title: string;
    description: string;
    color: string;
}

const journeySteps: JourneyStep[] = [
    {
        icon: Sparkles,
        title: "Curiosity",
        description: "Weekly hands-on STEM activities spark interest and wonder",
        color: "#FF6B35",
    },
    {
        icon: Zap,
        title: "Skills",
        description: "Artifact capture & pathway scoring track real growth",
        color: "#00C4B4",
    },
    {
        icon: Award,
        title: "Credentials",
        description: "Earn micro-credentials that validate your abilities",
        color: "#C7F464",
    },
    {
        icon: Briefcase,
        title: "Work",
        description: "Connect to internships & career pathways",
        color: "#9a459a",
    },
];

export const JourneySection = () => {
    return (
        <section id="journey" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="text-center mb-16"
                >
                    <motion.div variants={fadeInUp}>
                        <span className="text-[#FF6B35] font-semibold uppercase tracking-wide text-sm">
                            The Growth Tree Model
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
                            From Curious Minds to Career Ready
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Every learner's journey is unique. Our Growth Tree tracks progress
                            from first spark of interest to real-world opportunities.
                        </p>
                    </motion.div>
                </motion.div>

                {/* Journey Steps */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B35] via-[#00C4B4] to-[#9a459a] -translate-y-1/2 z-0" />

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-4 gap-8 relative z-10"
                    >
                        {journeySteps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={index}
                                    variants={fadeInUp}
                                    className="relative"
                                >
                                    <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col items-center">
                                        {/* Step Number */}
                                        <div
                                            className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                            style={{ backgroundColor: step.color }}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Icon */}
                                        <div
                                            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${step.color}20` }}
                                        >
                                            <Icon className="h-10 w-10" style={{ color: step.color }} />
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                        <p className="text-gray-600">{step.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
