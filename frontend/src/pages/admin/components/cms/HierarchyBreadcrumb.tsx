import type { HierarchyContext } from './cms-types';

interface HierarchyBreadcrumbProps {
  context: HierarchyContext;
}

const SEPARATOR = <span className="mx-1 text-gray-500">&rsaquo;</span>;

export default function HierarchyBreadcrumb({ context }: HierarchyBreadcrumbProps) {
  const crumbs: { label: string; value: string | null }[] = [
    { label: 'Pathway', value: context.pathway?.title ?? null },
    { label: 'Track', value: context.track?.title ?? null },
    { label: 'Program', value: context.program?.title ?? null },
    { label: 'Module', value: context.module?.title ?? null },
    { label: 'Unit', value: context.unit?.title ?? null },
    { label: 'Lesson', value: context.lesson?.title ?? null },
  ];

  const activeCrumbs = crumbs.filter((c) => c.value !== null);

  if (activeCrumbs.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No hierarchy selected
      </div>
    );
  }

  return (
    <nav aria-label="Content hierarchy" className="flex flex-wrap items-center gap-0 text-sm">
      {activeCrumbs.map((crumb, index) => (
        <span key={crumb.label} className="flex items-center">
          {index > 0 && SEPARATOR}
          <span className="text-gray-400 mr-1">{crumb.label}:</span>
          <span className="text-white font-medium">{crumb.value}</span>
        </span>
      ))}
    </nav>
  );
}
