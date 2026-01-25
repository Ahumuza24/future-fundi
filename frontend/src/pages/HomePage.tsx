import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Rocket, Users, BookOpen, BarChart3, ChevronRight, Star,
  TreeDeciduous, Award, Briefcase, Sparkles, Zap, Heart,
  GraduationCap, Target, MessageCircle, ArrowRight, Play
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const HomePage = () => {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const journeySteps = [
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

  const features = [
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

  const stats = [
    { value: "60,000+", label: "Learners" },
    { value: "500+", label: "Schools" },
    { value: "8", label: "Countries" },
    { value: "6-21", label: "Age Range" },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/fundi_bots_logo.png"
                alt="Fundi Bots"
                className="h-10 w-auto"
              />
              <span className="font-bold text-xl text-gray-900">Future Fundi</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#journey" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#portals" className="text-gray-600 hover:text-gray-900 transition-colors">Portals</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="text-gray-700 hover:text-gray-900"
              >
                Log In
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-[#FF6B35] hover:bg-[#E85A24] text-white rounded-full px-6"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
            {/* <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-sm font-medium mb-8"
            >
              <Rocket className="h-4 w-4" />
              Powered by Fundi Bots STEM Education
            </motion.div> */}

            {/* Main Title */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Where <span className="text-[#FF6B35]">Young Minds</span>
              <br />
              Grow Into <span className="bg-gradient-to-r from-[#00C4B4] to-[#C7F464] bg-clip-text text-transparent">Makers</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10"
            >
              Future Fundi transforms weekly STEM learning into verified skills,
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

      {/* Journey Section - The Growth Tree */}
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
                    <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
                      {/* Step Number */}
                      <div
                        className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: step.color }}
                      >
                        {index + 1}
                      </div>

                      {/* Icon */}
                      <div
                        className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
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

      {/* Features Section */}
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
                      className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer ${hoveredFeature === index ? 'bg-[#FF6B35]/10 scale-105' : 'hover:bg-gray-50'
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
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#FF6B35] via-[#00C4B4] to-[#C7F464] p-1">
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

      {/* Portals Section */}
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
            {[
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
            ].map((portal, index) => {
              const Icon = portal.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                >
                  <Link to={portal.path}>
                    <div className="group bg-gray-800 rounded-2xl p-6 hover:bg-gray-700 transition-all cursor-pointer h-full border border-gray-700 hover:border-gray-600">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                        style={{ backgroundColor: `${portal.color}20` }}
                      >
                        <Icon className="h-7 w-7" style={{ color: portal.color }} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{portal.title}</h3>
                      <p className="text-gray-400 mb-4">{portal.description}</p>
                      <div
                        className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all"
                        style={{ color: portal.color }}
                      >
                        Open Portal <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
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
    </div>
  );
};

export default HomePage;
