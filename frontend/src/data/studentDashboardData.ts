import {
  Bot,
  Globe,
  Smartphone,
  Brain,
  Printer,
  PenTool,
  Cpu,
  Wifi,
  Shield,
  Zap
} from "lucide-react";
import { type PathwayProps } from "@/components/student/PathwayCard";

export const upcomingEvents = [
  { id: 1, title: "Robotics Hackathon", date: "Oct 24, 2025", type: "event", color: "var(--fundi-orange)" },
  { id: 2, title: "Web Dev Project Due", date: "Oct 30, 2025", type: "deadline", color: "var(--fundi-purple)" },
  { id: 3, title: "3D Printing Workshop", date: "Nov 05, 2025", type: "workshop", color: "var(--fundi-cyan)" },
];

export const mockPathways: PathwayProps[] = [
  {
    id: "rob", title: "Robotics", icon: Bot,
    progress: 65, status: "good", microCredentialsEarned: 2, totalMicroCredentials: 5,
    currentModule: "Advanced Sensors", color: "var(--fundi-orange)"
  },
  {
    id: "web", title: "Web Development", icon: Globe,
    progress: 30, status: "warning", microCredentialsEarned: 1, totalMicroCredentials: 4,
    currentModule: "CSS Flexbox", color: "var(--fundi-purple)"
  },
  {
    id: "app", title: "App Development", icon: Smartphone,
    progress: 10, status: "good", microCredentialsEarned: 0, totalMicroCredentials: 4,
    currentModule: "React Native Basics", color: "var(--fundi-cyan)"
  },
  {
    id: "ai", title: "AI Tools", icon: Brain,
    progress: 5, status: "good", microCredentialsEarned: 0, totalMicroCredentials: 3,
    currentModule: "Intro to LLMs", color: "var(--fundi-lime)"
  },
  {
    id: "ele", title: "Electronics", icon: Cpu,
    progress: 40, status: "good", microCredentialsEarned: 1, totalMicroCredentials: 3,
    currentModule: "Circuit Design 101", color: "var(--fundi-pink)"
  },
  {
    id: "iot", title: "Internet of Things", icon: Wifi,
    progress: 15, status: "warning", microCredentialsEarned: 0, totalMicroCredentials: 3,
    currentModule: "Connecting ESP32", color: "var(--fundi-orange)"
  },
  {
    id: "3dp", title: "3D Printing", icon: Printer,
    progress: 0, status: "critical", microCredentialsEarned: 0, totalMicroCredentials: 2,
    currentModule: "Not Started", color: "var(--fundi-purple)"
  },
  {
    id: "cad", title: "CAD", icon: PenTool,
    progress: 0, status: "critical", microCredentialsEarned: 0, totalMicroCredentials: 2,
    currentModule: "Not Started", color: "var(--fundi-cyan)"
  },
  {
    id: "sec", title: "Data & Security", icon: Shield,
    progress: 0, status: "critical", microCredentialsEarned: 0, totalMicroCredentials: 4,
    currentModule: "Not Started", color: "var(--fundi-lime)"
  },
];

export const earnedBadges = [
  { id: "b1", name: "Bot Builder L1", pathway: "Robotics", icon: Bot, color: "var(--fundi-orange)" },
  { id: "b2", name: "Circuit Master", pathway: "Electronics", icon: Zap, color: "var(--fundi-pink)" },
  { id: "b3", name: "HTML Hero", pathway: "Web Dev", icon: Globe, color: "var(--fundi-purple)" },
];

export const nextBadge = { id: "b4", name: "Sensor Wizard", pathway: "Robotics", isLocked: true, color: "var(--fundi-orange)" };

export const activeProjects = [
  {
    id: 1,
    title: "Line Following Robot",
    pathway: "Robotics",
    description: "Building a robot that follows a black line on a white surface using IR sensors.",
    status: "In Progress",
    progress: 75,
    dueDate: "Oct 28",
    color: "var(--fundi-orange)"
  },
  {
    id: 2,
    title: "Personal Portfolio Site",
    pathway: "Web Development",
    description: "Creating a responsive portfolio website to showcase my projects.",
    status: "Planning",
    progress: 15,
    dueDate: "Nov 10",
    color: "var(--fundi-purple)"
  }
];
