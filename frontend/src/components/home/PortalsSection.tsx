import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Heart, BookOpen, BarChart3, ChevronRight } from "lucide-react";
import { fadeInUp, staggerContainer } from "./animations";

interface Portal {
    icon: typeof GraduationCap;
    title: string;
    description: string;
    path: string;
    color: string;
}

const portals: Portal[] = [
    {
        icon: GraduationCap,
        title: "Students",
        description: "Track your growth tree, pathway score, and showcase artifacts",
        path: "/student",
        color: "#FF6B35",
    },
    {
        icon: Heart,
        title: "Parents",
        description: "Stay connected with weekly updates and portfolio access",
        path: "/parent",
        color: "#9a459a",
    },
    {
        icon: BookOpen,
        title: "Teachers",
        description: "Capture evidence, track attendance, and assess growth",
        path: "/teacher",
        color: "#00C4B4",
    },
    {
        icon: BarChart3,
        title: "Leaders",
        description: "School-wide analytics and impact reporting",
        path: "/leader",
        color: "#C7F464",
    },
];

export const PortalsSection = () => {
    return (
        <section id="portals" className="py-24 bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="text-center mb-16"
                >
                    <motion.span
                        variants={fadeInUp}
                        className="text-[#C7F464] font-semibold uppercase tracking-wide text-sm"
                    >
                        For Everyone
                    </motion.span>
                    <motion.h2
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6"
                    >
                        One Platform, Four Perspectives
                    </motion.h2>
                    <motion.p
                        variants={fadeInUp}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        Tailored dashboards for every role in the learning journey
                    </motion.p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {portals.map((portal, index) => {
                        const Icon = portal.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                            >
                                <Link to={portal.path} className="block h-full">
                                    <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 hover:bg-gray-800 transition-all duration-300 cursor-pointer h-full border border-gray-700/50 hover:border-gray-600 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden flex flex-col">
                                        {/* Glow effect */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
                                            style={{ backgroundColor: `${portal.color}15` }}
                                        >
                                            <Icon className="h-7 w-7 transition-all duration-300" style={{ color: portal.color, filter: `drop-shadow(0 0 8px ${portal.color}40)` }} />
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2">{portal.title}</h3>
                                        <p className="text-gray-400 mb-4 flex-grow leading-relaxed text-sm md:text-base">{portal.description}</p>

                                        <div
                                            className="flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all mt-auto"
                                            style={{ color: portal.color }}
                                        >
                                            Open Portal <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};
