import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { usePathwayLearning } from './hooks/usePathwayLearning';
import { useEscapeKey } from './hooks/useEscapeKey';
import type {
  NormalizedMediaResource,
  PathwayLevel,
  PathwayModuleWithLevel,
} from './types';
import { ModuleSidebar } from './components/ModuleSidebar';
import { ModuleDetail } from './components/ModuleDetail';
import { PathwayHeader } from './components/PathwayHeader';
import { MediaModal } from './components/MediaModal';
import {
  dedupeModules,
  flattenModules,
  getModuleIndex,
  getModuleLevel,
  getModuleProgressSummary,
  selectInitialLevel,
} from './utils/modules';
import { normalizeMediaResources } from './utils/media';

const PathwayLearning = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<NormalizedMediaResource | null>(null);

  const {
    data,
    isLoading,
    isError,
  } = usePathwayLearning(enrollmentId);

  const levels = useMemo(() => data?.levels ?? [], [data?.levels]);

  const moduleList = useMemo<PathwayModuleWithLevel[]>(
    () => dedupeModules(flattenModules(levels)),
    [levels]
  );

  const resolvedModuleId = useMemo(() => {
    if (!moduleList.length) {
      return null;
    }
    if (selectedModuleId && moduleList.some((module) => module.id === selectedModuleId)) {
      return selectedModuleId;
    }
    const initialLevel = selectInitialLevel(levels);
    return initialLevel?.modules[0]?.id ?? moduleList[0].id;
  }, [moduleList, selectedModuleId, levels]);

  const selectedModule = useMemo(() => {
    if (!resolvedModuleId) {
      return moduleList[0] ?? null;
    }
    return moduleList.find((module) => module.id === resolvedModuleId) ?? moduleList[0] ?? null;
  }, [moduleList, resolvedModuleId]);

  const selectedLevel = useMemo<PathwayLevel | null>(() => {
    if (!resolvedModuleId) {
      return selectInitialLevel(levels) ?? null;
    }
    return getModuleLevel(levels, resolvedModuleId) ?? null;
  }, [levels, resolvedModuleId]);

  const moduleIndex = useMemo(
    () => getModuleIndex(moduleList, selectedModule?.id ?? null),
    [moduleList, selectedModule?.id]
  );

  const { totalModules, completedModules } = useMemo(
    () => getModuleProgressSummary(levels),
    [levels]
  );

  useEscapeKey(() => setSelectedMedia(null));

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      setSelectedModuleId(moduleId);
    },
    []
  );

  const handleNext = useCallback(() => {
      if (moduleIndex < 0 || moduleIndex >= moduleList.length - 1 || !selectedModule) {
      return;
    }
    const currentIndex = moduleList.findIndex((module) => module.id === selectedModule.id);
    if (currentIndex < moduleList.length - 1) {
      handleSelectModule(moduleList[currentIndex + 1].id);
    }
  }, [handleSelectModule, moduleIndex, moduleList, selectedModule]);

  const handlePrevious = useCallback(() => {
    if (moduleIndex <= 0 || !selectedModule) {
      return;
    }
    const currentIndex = moduleList.findIndex((module) => module.id === selectedModule.id);
    if (currentIndex > 0) {
      handleSelectModule(moduleList[currentIndex - 1].id);
    }
  }, [handleSelectModule, moduleIndex, moduleList, selectedModule]);

  const mediaResources = useMemo(
    () => normalizeMediaResources(selectedModule?.id ?? 'module', selectedModule?.mediaFiles ?? []),
    [selectedModule]
  );

  const handleMediaSelect = useCallback(
    (media: NormalizedMediaResource) => {
      if (!media.url) {
        toast.error('This media file has no URL.', 'Unavailable Media');
        return;
      }
      setSelectedMedia(media);
    },
    []
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-[var(--fundi-orange)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading pathway...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load pathway content</p>
          <Button onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PathwayHeader
        courseName={data.course.name}
        selectedModuleName={selectedModule?.name}
        completedModules={completedModules}
        totalModules={totalModules}
        overallPercentage={data.progress.overallPercentage}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <ModuleSidebar modules={moduleList} selectedModuleId={selectedModuleId} onSelect={handleSelectModule} />
          </div>

          <div className="col-span-12 lg:col-span-9">
            <motion.div layout>
              <ModuleDetail
                module={selectedModule}
                moduleIndex={moduleIndex >= 0 ? moduleIndex : 0}
                totalModules={moduleList.length}
                progressPercent={selectedLevel?.progress.completionPercentage ?? 0}
                onPrevious={handlePrevious}
                onNext={handleNext}
                canGoPrevious={moduleIndex > 0}
                canGoNext={moduleIndex < moduleList.length - 1}
                onMediaSelect={handleMediaSelect}
                mediaResources={mediaResources}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </div>
  );
};

export default PathwayLearning;
