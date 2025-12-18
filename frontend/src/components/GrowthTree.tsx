import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Shield, 
  Users, 
  Target,
  BookOpen,
  Calculator,
  MessageSquare,
  Code,
  Wrench,
  Droplet,
  Zap,
  Activity,
  Cpu,
  Settings,
  MapPin,
  Sprout,
  Wind,
  FileText,
  Award,
  Briefcase,
  Calendar,
  Star,
  Sparkles,
  Trophy
} from "lucide-react";

interface Root {
  id: string;
  label: string;
  level: number; // 0-3 for Initiate, Practice, Transfer
}

interface TrunkSkill {
  id: string;
  label: string;
  level: number; // 0-3 for Initiate, Practice, Transfer
}

interface Ring {
  term: string;
  year: number;
  growth: number; // 0-100
}

interface Branch {
  id: string;
  domain: string;
  artifacts: Artifact[];
  outcomes: Outcome[];
  angle: number; // degrees for positioning
}

interface Artifact {
  id: string;
  title: string;
  week: number;
  concept: string;
  skill: string;
  reflection: string;
  level: number; // 0-3
}

interface Outcome {
  id: string;
  type: "credential" | "showcase" | "shadow" | "internship" | "contract" | "competition";
  title: string;
  date: string;
}

interface GrowthTreeData {
  roots: Root[];
  trunk: TrunkSkill[];
  rings: Ring[];
  branches: Branch[];
}

interface GrowthTreeProps {
  learnerId?: string;
  data?: GrowthTreeData;
  className?: string;
}

const defaultData: GrowthTreeData = {
  roots: [
    { id: "motivation", label: "Motivation", level: 2 },
    { id: "sel", label: "SEL", level: 2 },
    { id: "safety", label: "Safety", level: 3 },
    { id: "ethics", label: "Ethics", level: 2 },
    { id: "regulation", label: "Regulation", level: 1 },
    { id: "collaboration", label: "Collaboration", level: 2 },
    { id: "purpose", label: "Purpose", level: 1 },
  ],
  trunk: [
    { id: "literacy", label: "Literacy", level: 2 },
    { id: "numeracy", label: "Numeracy/Logic", level: 2 },
    { id: "communication", label: "Communication", level: 2 },
    { id: "digital", label: "Digital/Data", level: 1 },
    { id: "making", label: "Making/Safety", level: 2 },
  ],
  rings: [
    { term: "Term 1", year: 2024, growth: 45 },
    { term: "Term 2", year: 2024, growth: 68 },
    { term: "Term 3", year: 2024, growth: 72 },
  ],
  branches: [
    {
      id: "energy",
      domain: "Energy/Renewables",
      angle: -45,
      artifacts: [
        { id: "a1", title: "Solar Panel", week: 1, concept: "Photovoltaics", skill: "Problem Solving", reflection: "Built my first working panel!", level: 2 },
        { id: "a2", title: "Wind Turbine", week: 3, concept: "Kinetic Energy", skill: "Making", reflection: "Learned about energy conversion", level: 1 },
      ],
      outcomes: [
        { id: "o1", type: "credential", title: "Renewable Energy Badge", date: "2024-12-15" },
      ],
    },
    {
      id: "robotics",
      domain: "Mechatronics",
      angle: 0,
      artifacts: [
        { id: "a3", title: "Robot Arm", week: 2, concept: "Servo Control", skill: "Digital/Data", reflection: "Programmed precise movements", level: 2 },
      ],
      outcomes: [],
    },
    {
      id: "software",
      domain: "Software/AI",
      angle: 45,
      artifacts: [
        { id: "a4", title: "Chatbot", week: 4, concept: "NLP Basics", skill: "Communication", reflection: "Created a simple AI assistant", level: 1 },
      ],
      outcomes: [],
    },
    {
      id: "water",
      domain: "Water/WASH",
      angle: -90,
      artifacts: [],
      outcomes: [],
    },
  ],
};

const getDomainIcon = (domain: string) => {
  const icons: Record<string, typeof Droplet> = {
    "Water/WASH": Droplet,
    "Energy/Renewables": Zap,
    "Health/Bio": Activity,
    "Software/AI": Cpu,
    "Mechatronics": Settings,
    "GIS/Geo": MapPin,
    "Agri-tech": Sprout,
    "Climate/Environment": Wind,
    "Math/Applied Stats": Calculator,
  };
  return icons[domain] || FileText;
};

const getOutcomeIcon = (type: Outcome["type"]) => {
  const icons = {
    credential: Award,
    showcase: Star,
    shadow: Briefcase,
    internship: Briefcase,
    contract: FileText,
    competition: Trophy,
  };
  return icons[type] || Award;
};

const getLevelColor = (level: number) => {
  if (level === 0) return "var(--fundi-red)";
  if (level === 1) return "var(--fundi-yellow)";
  if (level === 2) return "var(--fundi-lime)";
  return "var(--fundi-cyan)";
};

const getLevelLabel = (level: number) => {
  const labels = ["Initiate", "Practice", "Transfer", "Master"];
  return labels[level] || "Initiate";
};

const GrowthTree = ({ learnerId, data = defaultData, className = "" }: GrowthTreeProps) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);

  // SVG dimensions
  const svgWidth = 1200;
  const svgHeight = 800;
  const centerX = svgWidth / 2;
  const trunkBaseY = svgHeight - 100;
  const trunkTopY = 200;
  const trunkWidth = 80;

  // Calculate branch positions
  const branchPositions = useMemo(() => {
    return data.branches.map((branch) => {
      const angleRad = (branch.angle * Math.PI) / 180;
      const branchLength = 150 + (branch.artifacts.length * 20) + (branch.outcomes.length * 30);
      const branchX = centerX + Math.cos(angleRad) * branchLength;
      const branchY = trunkTopY + Math.sin(angleRad) * branchLength;
      return { ...branch, x: branchX, y: branchY };
    });
  }, [data.branches, centerX, trunkTopY]);

  return (
    <div className={`growth-tree-container ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="heading-font text-2xl font-bold mb-2" style={{ color: 'var(--fundi-black)' }}>
            Growth Tree
          </h3>
          <p className="text-sm text-gray-600">
            Your learning journey: Roots → Trunk → Branches → Leaves → Fruit
          </p>
        </div>

        {/* Interactive SVG Tree */}
        <div className="relative w-full overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="border rounded-lg bg-gradient-to-b from-green-50 to-blue-50"
          >
            {/* Growth Rings on Trunk */}
            {data.rings.map((ring, index) => {
              const ringY = trunkTopY + (trunkBaseY - trunkTopY) * (1 - index / data.rings.length);
              const ringWidth = trunkWidth + (ring.growth / 100) * 40;
              return (
                <g key={ring.term}>
                  <circle
                    cx={centerX}
                    cy={ringY}
                    r={ringWidth / 2}
                    fill="none"
                    stroke={getLevelColor(Math.floor(ring.growth / 25))}
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <text
                    x={centerX + ringWidth / 2 + 10}
                    y={ringY}
                    fontSize="12"
                    fill="var(--fundi-black)"
                    className="mono-font"
                  >
                    {ring.term} {ring.year} ({ring.growth}%)
                  </text>
                </g>
              );
            })}

            {/* Trunk */}
            <rect
              x={centerX - trunkWidth / 2}
              y={trunkTopY}
              width={trunkWidth}
              height={trunkBaseY - trunkTopY}
              fill="var(--fundi-orange-dark)"
              stroke="var(--fundi-orange)"
              strokeWidth="3"
              rx="5"
            />

            {/* Trunk Skills Labels */}
            {data.trunk.map((skill, index) => {
              const skillY = trunkTopY + ((trunkBaseY - trunkTopY) / (data.trunk.length + 1)) * (index + 1);
              return (
                <g key={skill.id}>
                  <rect
                    x={centerX - trunkWidth / 2 - 100}
                    y={skillY - 15}
                    width="90"
                    height="30"
                    fill={getLevelColor(skill.level)}
                    fillOpacity="0.8"
                    rx="4"
                    className="cursor-pointer"
                    onClick={() => setSelectedElement(skill.id)}
                  />
                  <text
                    x={centerX - trunkWidth / 2 - 55}
                    y={skillY + 5}
                    fontSize="11"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                    className="cursor-pointer"
                    onClick={() => setSelectedElement(skill.id)}
                  >
                    {skill.label}
                  </text>
                  <text
                    x={centerX - trunkWidth / 2 - 55}
                    y={skillY + 18}
                    fontSize="9"
                    fill="white"
                    textAnchor="middle"
                    className="cursor-pointer"
                    onClick={() => setSelectedElement(skill.id)}
                  >
                    {getLevelLabel(skill.level)}
                  </text>
                </g>
              );
            })}

            {/* Branches */}
            {branchPositions.map((branch) => {
              const angleRad = (branch.angle * Math.PI) / 180;
              const DomainIcon = getDomainIcon(branch.domain);
              const isHovered = hoveredBranch === branch.id;

              return (
                <g key={branch.id}>
                  {/* Branch Line */}
                  <line
                    x1={centerX}
                    y1={trunkTopY}
                    x2={branch.x}
                    y2={branch.y}
                    stroke="var(--fundi-orange)"
                    strokeWidth="4"
                    opacity={isHovered ? 1 : 0.6}
                    className="transition-opacity"
                  />

                  {/* Branch Domain Circle */}
                  <g
                    onMouseEnter={() => setHoveredBranch(branch.id)}
                    onMouseLeave={() => setHoveredBranch(null)}
                    onClick={() => setSelectedElement(branch.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={branch.x}
                      cy={branch.y}
                      r="40"
                      fill={isHovered ? "var(--fundi-cyan)" : "var(--fundi-lime)"}
                      fillOpacity="0.9"
                      stroke="var(--fundi-black)"
                      strokeWidth="2"
                    />
                    <foreignObject
                      x={branch.x - 20}
                      y={branch.y - 20}
                      width="40"
                      height="40"
                    >
                      <div className="flex items-center justify-center h-full">
                        <DomainIcon className="h-6 w-6 text-white" />
                      </div>
                    </foreignObject>
                    <text
                      x={branch.x}
                      y={branch.y + 60}
                      fontSize="12"
                      fill="var(--fundi-black)"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {branch.domain}
                    </text>
                  </g>

                  {/* Leaves (Artifacts) */}
                  {branch.artifacts.map((artifact, artIndex) => {
                    const leafAngle = branch.angle + (artIndex - branch.artifacts.length / 2) * 15;
                    const leafAngleRad = (leafAngle * Math.PI) / 180;
                    const leafDistance = 80 + artIndex * 25;
                    const leafX = branch.x + Math.cos(leafAngleRad) * leafDistance;
                    const leafY = branch.y + Math.sin(leafAngleRad) * leafDistance;

                    return (
                      <g
                        key={artifact.id}
                        onClick={() => setSelectedElement(artifact.id)}
                        className="cursor-pointer"
                      >
                        {/* Leaf Shape */}
                        <ellipse
                          cx={leafX}
                          cy={leafY}
                          rx="25"
                          ry="15"
                          fill={getLevelColor(artifact.level)}
                          fillOpacity="0.7"
                          stroke="var(--fundi-black)"
                          strokeWidth="1.5"
                          transform={`rotate(${leafAngle} ${leafX} ${leafY})`}
                        />
                        <text
                          x={leafX}
                          y={leafY + 4}
                          fontSize="10"
                          fill="white"
                          textAnchor="middle"
                          fontWeight="bold"
                          transform={`rotate(${leafAngle} ${leafX} ${leafY})`}
                        >
                          W{artifact.week}
                        </text>
                      </g>
                    );
                  })}

                  {/* Fruit (Outcomes) */}
                  {branch.outcomes.map((outcome, outIndex) => {
                    const fruitAngle = branch.angle + (outIndex - branch.outcomes.length / 2) * 20;
                    const fruitAngleRad = (fruitAngle * Math.PI) / 180;
                    const fruitDistance = 100 + outIndex * 30;
                    const fruitX = branch.x + Math.cos(fruitAngleRad) * fruitDistance;
                    const fruitY = branch.y + Math.sin(fruitAngleRad) * fruitDistance;
                    const OutcomeIcon = getOutcomeIcon(outcome.type);

                    return (
                      <g
                        key={outcome.id}
                        onClick={() => setSelectedElement(outcome.id)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={fruitX}
                          cy={fruitY}
                          r="20"
                          fill="var(--fundi-purple)"
                          stroke="var(--fundi-yellow)"
                          strokeWidth="2"
                        />
                        <foreignObject
                          x={fruitX - 12}
                          y={fruitY - 12}
                          width="24"
                          height="24"
                        >
                          <div className="flex items-center justify-center h-full">
                            <OutcomeIcon className="h-4 w-4 text-white" />
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Roots */}
            {data.roots.map((root, index) => {
              const rootX = centerX - trunkWidth / 2 + (trunkWidth / (data.roots.length + 1)) * (index + 1);
              const rootY = trunkBaseY + 50;
              const rootDepth = 30 + root.level * 10;

              return (
                <g key={root.id}>
                  {/* Root Line */}
                  <path
                    d={`M ${rootX} ${trunkBaseY} Q ${rootX - 20} ${rootY} ${rootX - 30} ${rootY + rootDepth}`}
                    fill="none"
                    stroke={getLevelColor(root.level)}
                    strokeWidth="3"
                    opacity="0.7"
                    className="cursor-pointer"
                    onClick={() => setSelectedElement(root.id)}
                  />
                  {/* Root Label */}
                  <text
                    x={rootX - 30}
                    y={rootY + rootDepth + 15}
                    fontSize="10"
                    fill={getLevelColor(root.level)}
                    fontWeight="bold"
                    className="cursor-pointer"
                    onClick={() => setSelectedElement(root.id)}
                  >
                    {root.label}
                  </text>
                  <text
                    x={rootX - 30}
                    y={rootY + rootDepth + 27}
                    fontSize="8"
                    fill="var(--fundi-black)"
                    className="cursor-pointer"
                    onClick={() => setSelectedElement(root.id)}
                  >
                    {getLevelLabel(root.level)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Element Details */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 p-4 rounded-lg border-2"
              style={{ borderColor: 'var(--fundi-orange)' }}
            >
              {(() => {
                const root = data.roots.find((r) => r.id === selectedElement);
                const skill = data.trunk.find((s) => s.id === selectedElement);
                const artifact = data.branches
                  .flatMap((b) => b.artifacts)
                  .find((a) => a.id === selectedElement);
                const outcome = data.branches
                  .flatMap((b) => b.outcomes)
                  .find((o) => o.id === selectedElement);
                const branch = data.branches.find((b) => b.id === selectedElement);

                if (root) {
                  return (
                    <div>
                      <h4 className="font-bold text-lg mb-2">Root: {root.label}</h4>
                      <p className="text-sm text-gray-600">
                        Level: <span className="mono-font font-semibold">{getLevelLabel(root.level)}</span>
                      </p>
                    </div>
                  );
                }
                if (skill) {
                  return (
                    <div>
                      <h4 className="font-bold text-lg mb-2">Durable Skill: {skill.label}</h4>
                      <p className="text-sm text-gray-600">
                        Level: <span className="mono-font font-semibold">{getLevelLabel(skill.level)}</span>
                      </p>
                    </div>
                  );
                }
                if (artifact) {
                  return (
                    <div>
                      <h4 className="font-bold text-lg mb-2">Artifact: {artifact.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Week {artifact.week} • Concept: {artifact.concept} • Skill: {artifact.skill}
                      </p>
                      <p className="text-sm italic">"{artifact.reflection}"</p>
                      <p className="text-xs mt-2">
                        Level: <span className="mono-font font-semibold">{getLevelLabel(artifact.level)}</span>
                      </p>
                    </div>
                  );
                }
                if (outcome) {
                  return (
                    <div>
                      <h4 className="font-bold text-lg mb-2">Outcome: {outcome.title}</h4>
                      <p className="text-sm text-gray-600">
                        Type: {outcome.type} • Date: {outcome.date}
                      </p>
                    </div>
                  );
                }
                if (branch) {
                  return (
                    <div>
                      <h4 className="font-bold text-lg mb-2">Domain: {branch.domain}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {branch.artifacts.length} artifacts • {branch.outcomes.length} outcomes
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
              <button
                onClick={() => setSelectedElement(null)}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="font-semibold mb-2">Levels (0-3):</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--fundi-red)' }} />
                <span>Initiate (0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--fundi-yellow)' }} />
                <span>Practice (1)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--fundi-lime)' }} />
                <span>Transfer (2)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--fundi-cyan)' }} />
                <span>Master (3)</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Tree Parts:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-800" />
                <span>Roots (SEL)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--fundi-orange-dark)' }} />
                <span>Trunk (Skills)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--fundi-lime)' }} />
                <span>Branches (Domains)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--fundi-cyan)' }} />
                <span>Leaves (Artifacts)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--fundi-purple)' }} />
                <span>Fruit (Outcomes)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthTree;
