import type {
  PathwayHierarchy,
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

export const flattenHierarchyModules = (
  hierarchy?: PathwayHierarchy
): PathwayModuleWithLevel[] => {
  if (!hierarchy) {
    return [];
  }

  return hierarchy.tracks.flatMap((track) =>
    track.programs.flatMap((program) =>
      program.modules.map((module) => ({
        id: module.id,
        name: module.name,
        description: module.outcome_statement,
        content: "",
        mediaFiles: [],
        levelName: hierarchy.name,
        trackTitle: track.title,
        programTitle: program.title,
        outcome_statement: module.outcome_statement,
        gate: module.gate,
        access: module.access,
        units: module.units,
      }))
    )
  );
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

export const getHierarchyProgressSummary = (
  modules: PathwayModuleWithLevel[]
): { totalModules: number; completedModules: number } => ({
  totalModules: modules.length,
  completedModules: modules.filter((module) => module.gate?.reason === "completed").length,
});
