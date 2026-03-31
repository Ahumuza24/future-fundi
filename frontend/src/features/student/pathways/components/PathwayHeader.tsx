import { Progress } from '@/components/ui/progress';

interface PathwayHeaderProps {
  courseName: string;
  selectedModuleName?: string;
  completedModules: number;
  totalModules: number;
  overallPercentage: number;
}

export const PathwayHeader = ({
  courseName,
  selectedModuleName,
  completedModules,
  totalModules,
  overallPercentage,
}: PathwayHeaderProps) => (
  <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="font-bold text-lg text-gray-900">{courseName}</h1>
            <p className="text-sm text-gray-500">
              {selectedModuleName || 'Select a microcredential'} • {completedModules}/{totalModules} Microcredentials Completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">Overall Progress</p>
            <p className="text-2xl font-bold text-[var(--fundi-orange)]">{overallPercentage}%</p>
          </div>
          <div className="w-24">
            <Progress value={overallPercentage} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
