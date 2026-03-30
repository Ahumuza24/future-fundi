import { ButtonHTMLAttributes, memo } from 'react';
import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PathwayModuleWithLevel } from '../types';

interface ModuleSidebarProps {
  modules: PathwayModuleWithLevel[];
  selectedModuleId: string | null;
  onSelect: (moduleId: string) => void;
}

export const ModuleSidebar = memo(({ modules, selectedModuleId, onSelect }: ModuleSidebarProps) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold text-gray-700">Microcredentials</CardTitle>
    </CardHeader>
    <CardContent className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto">
      {modules.map((module, index) => (
        <ModuleSidebarButton
          key={module.id}
          active={selectedModuleId === module.id}
          index={index}
          module={module}
          onClick={() => onSelect(module.id)}
        />
      ))}
    </CardContent>
  </Card>
));

interface ModuleSidebarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  module: PathwayModuleWithLevel;
  index: number;
  active: boolean;
}

const ModuleSidebarButton = ({ module, index, active, ...props }: ModuleSidebarButtonProps) => (
  <button
    {...props}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
      active ? 'bg-[var(--fundi-orange)] text-white font-medium' : 'hover:bg-orange-50 text-gray-700'
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold opacity-70">{index + 1}</span>
      <span className="truncate flex-1">{module.name}</span>
    </div>
    {module.badgeName && (
      <div className={`flex items-center gap-1 mt-1 text-xs ${active ? 'opacity-90' : 'opacity-70'}`}>
        <Award className="h-3 w-3" />
        <span>{module.badgeName}</span>
      </div>
    )}
  </button>
);
