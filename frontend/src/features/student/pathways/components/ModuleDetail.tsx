import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ChevronRight, FileText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type {
  NormalizedMediaResource,
  PathwayModule,
} from '../types';

interface ModuleDetailProps {
  module: PathwayModule | null;
  moduleIndex: number;
  totalModules: number;
  progressPercent: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onMediaSelect: (media: NormalizedMediaResource) => void;
  mediaResources: NormalizedMediaResource[];
}

export const ModuleDetail = ({
  module,
  moduleIndex,
  totalModules,
  progressPercent,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  onMediaSelect,
  mediaResources,
}: ModuleDetailProps) => (
  <AnimatePresence mode="wait">
    {module ? (
      <motion.div
        key={module.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    Microcredential {moduleIndex + 1} of {totalModules}
                  </span>
                  {module.badgeName && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {module.badgeName}
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl mb-2">{module.name}</CardTitle>
                <p className="text-gray-600">{module.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-medium text-gray-700">Module Progress</p>
                <p className="text-2xl font-bold text-[var(--fundi-orange)]">{progressPercent}%</p>
                <Progress value={progressPercent} className="h-2 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {module.content && (
              <Section title="Learning Content" icon={<FileText className="h-5 w-5 text-gray-500" />}>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {module.content}
                </div>
              </Section>
            )}

            {mediaResources.length > 0 && (
              <Section title="Media Resources" icon={<Play className="h-5 w-5 text-gray-500" />}>
                <p className="text-xs text-gray-500 mb-3">({mediaResources.length} files)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {mediaResources.map((media) => (
                    <button
                      key={media.key}
                      type="button"
                      onClick={() => media.url && onMediaSelect(media)}
                      className="border rounded-lg overflow-hidden hover:shadow-lg transition-all bg-white group text-left"
                    >
                      <div className="relative h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {renderMediaPreview(media)}
                      </div>
                      <div className="p-2">
                        <p className="font-medium text-xs truncate" title={media.displayName}>
                          {media.displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{media.typeLabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <Button variant="outline" onClick={onPrevious} disabled={!canGoPrevious}>
                Previous
              </Button>
              <Button
                onClick={onNext}
                disabled={!canGoNext}
                className="bg-[var(--fundi-orange)] hover:bg-orange-600"
              >
                Next Microcredential
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ) : (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a microcredential to start learning</p>
        </CardContent>
      </Card>
    )}
  </AnimatePresence>
);

interface SectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => (
  <div className="bg-white rounded-lg p-6 border">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);

const renderMediaPreview = (media: NormalizedMediaResource) => {
  if (media.isImage && media.url) {
    return (
      <img
        src={media.url}
        alt={media.displayName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
    );
  }

  if (media.isVideo) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <Play className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          Video
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-gray-400">
      <FileText className="h-8 w-8 mb-1" />
      <span className="text-xs">{media.typeLabel}</span>
    </div>
  );
};
