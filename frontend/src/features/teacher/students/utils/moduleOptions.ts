import type { TeacherModuleOption } from '../types';

type RawModule = {
  id?: string | number;
  name?: string;
  badge_name?: string;
  description?: string;
};

export const normalizeModuleOptions = (modules: RawModule[] = []): TeacherModuleOption[] =>
  modules
    .filter((module) => module && module.id)
    .map((module) => ({
      id: String(module.id),
      name: module.name || 'Untitled Module',
      badge_name: module.badge_name || '',
      description: module.description || '',
    }));
