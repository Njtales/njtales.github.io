import { lazy, Suspense, type ComponentType } from 'react';
import { useStore, type BuildingId } from '../../store/useStore';
import { getBuilding } from '../../data/buildings';
import { PanelShell } from './PanelShell';

// Code-split per panel — none of these load until the visitor actually
// opens that building, per the spec's Suspense-lazy-load performance rule.
const ProjectsPanel = lazy(() => import('./ProjectsPanel').then((m) => ({ default: m.ProjectsPanel })));
const TechStackPanel = lazy(() => import('./TechStackPanel').then((m) => ({ default: m.TechStackPanel })));
const ExperiencePanel = lazy(() => import('./ExperiencePanel').then((m) => ({ default: m.ExperiencePanel })));
const LearningPanel = lazy(() => import('./LearningPanel').then((m) => ({ default: m.LearningPanel })));
const AboutPanel = lazy(() => import('./AboutPanel').then((m) => ({ default: m.AboutPanel })));
const HobbiesPanel = lazy(() => import('./HobbiesPanel').then((m) => ({ default: m.HobbiesPanel })));
const ContactPanel = lazy(() => import('./ContactPanel').then((m) => ({ default: m.ContactPanel })));

const PANEL_COMPONENTS: Record<BuildingId, ComponentType> = {
  projects: ProjectsPanel,
  techstack: TechStackPanel,
  experience: ExperiencePanel,
  learning: LearningPanel,
  about: AboutPanel,
  hobbies: HobbiesPanel,
  contact: ContactPanel,
};

export function PanelHost() {
  const activePanel = useStore((s) => s.activePanel);
  if (!activePanel) return null;

  const building = getBuilding(activePanel);
  const Content = PANEL_COMPONENTS[activePanel];

  return (
    <PanelShell building={building}>
      <Suspense fallback={<p className="text-sm text-[#AABBCC]">Loading…</p>}>
        <Content />
      </Suspense>
    </PanelShell>
  );
}
