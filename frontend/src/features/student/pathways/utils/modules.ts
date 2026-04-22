import type {
  PathwayLevel,
  PathwayModuleWithLevel,
} from '../types';

export const flattenModules = (levels: PathwayLevel[]): PathwayModuleWithLevel[] =>
  levels.flatMap((level) =>
    level.modules.map((module) => ({
      ...module,
      levelName: level.name,
    }))
  );

export const dedupeModules = (
  modules: PathwayModuleWithLevel[]
): PathwayModuleWithLevel[] => {
  const unique = new Map<string, PathwayModuleWithLevel>();
  modules.forEach((module) => {
    if (!unique.has(module.id)) {
      unique.set(module.id, module);
    }
  });
  return Array.from(unique.values());
};

export const selectInitialLevel = (
  levels: PathwayLevel[]
): PathwayLevel | undefined =>
  levels.find((level) => level.isCurrent) ??
  levels.find((level) => !level.isLocked) ??
  levels[0];

export const getModuleLevel = (
  levels: PathwayLevel[],
  moduleId: string
): PathwayLevel | undefined =>
  levels.find((level) => level.modules.some((module) => module.id === moduleId));

export const getModuleIndex = (
  modules: PathwayModuleWithLevel[],
  moduleId: string | null
): number => (moduleId ? modules.findIndex((module) => module.id === moduleId) : -1);

export const getModuleProgressSummary = (levels: PathwayLevel[]): { totalModules: number; completedModules: number } => {
  const modules = dedupeModules(flattenModules(levels));
  const completedModules = modules.filter((module) => {
    const level = getModuleLevel(levels, module.id);
    return level?.progress.completed;
  }).length;
  return {
    totalModules: modules.length,
    completedModules,
  };
};
