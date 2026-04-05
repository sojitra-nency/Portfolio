import { nodes } from '@/data/nodes';
import { CATEGORY_COLORS } from '@/data/types';
import StickyHeader from '@/components/quick-view/StickyHeader';
import ScrollProgress from '@/components/quick-view/ScrollProgress';
import HeroSection from '@/components/quick-view/HeroSection';
import AboutSection from '@/components/quick-view/AboutSection';
import SkillsSection from '@/components/quick-view/SkillsSection';
import ProjectsSection from '@/components/quick-view/ProjectsSection';
import ExperienceSection from '@/components/quick-view/ExperienceSection';
import EducationSection from '@/components/quick-view/EducationSection';
import CertificationsSection from '@/components/quick-view/CertificationsSection';
import ContactSection from '@/components/quick-view/ContactSection';
import FooterSection from '@/components/quick-view/FooterSection';

export const metadata = {
  title: 'Nency Sojitra — Full Stack Python Developer',
  description:
    'Full Stack Python Developer with 3+ years of experience building scalable backends, APIs, and production-ready web applications.',
};

export default function QuickViewPage() {
  const origin = nodes.find((n) => n.id === 'origin')!;
  const getChildren = (parentId: string) =>
    nodes.filter((n) => n.parentId === parentId && !n.isHidden);

  const sectionDefs = [
    { id: 'about', label: 'About Me' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'education', label: 'Education' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'contact', label: 'Contact' },
  ];

  // Build header sections with colors
  const headerSections = sectionDefs.map((s) => {
    if (s.id === 'certifications') {
      return { id: s.id, label: s.label, color: CATEGORY_COLORS.core };
    }
    const parentNode = nodes.find((n) => n.id === s.id);
    return {
      id: s.id,
      label: s.label,
      color: parentNode ? CATEGORY_COLORS[parentNode.category] : '#FFFFFF',
    };
  });

  // Get section data
  const aboutParent = nodes.find((n) => n.id === 'about')!;
  const skillsParent = nodes.find((n) => n.id === 'skills')!;
  const projectsParent = nodes.find((n) => n.id === 'projects')!;
  const experienceParent = nodes.find((n) => n.id === 'experience')!;
  const educationParent = nodes.find((n) => n.id === 'education')!;
  const contactParent = nodes.find((n) => n.id === 'contact')!;

  const allTools = nodes.filter((n) => n.category === 'tools' && !n.isHidden);

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      <ScrollProgress />
      <StickyHeader sections={headerSections} />

      {/* Spacer for fixed header */}
      <div className="h-14" />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-28">
        <HeroSection
          name={origin.label}
          summary={origin.summary!}
          description={origin.description}
        />

        <AboutSection
          nodes={getChildren('about')}
          color={CATEGORY_COLORS[aboutParent.category]}
          subtitle={aboutParent.description}
        />

        <SkillsSection
          nodes={getChildren('skills')}
          allTools={allTools}
          color={CATEGORY_COLORS[skillsParent.category]}
          subtitle={skillsParent.description}
        />

        <ExperienceSection
          nodes={getChildren('experience')}
          color={CATEGORY_COLORS[experienceParent.category]}
          subtitle={experienceParent.description}
        />

        <ProjectsSection
          nodes={getChildren('projects')}
          color={CATEGORY_COLORS[projectsParent.category]}
          subtitle={projectsParent.description}
        />

        <EducationSection
          nodes={getChildren('education')}
          color={CATEGORY_COLORS[educationParent.category]}
          subtitle={educationParent.description}
        />

        <CertificationsSection />

        <ContactSection
          nodes={getChildren('contact')}
          color={CATEGORY_COLORS[contactParent.category]}
          subtitle={contactParent.description}
        />
      </main>

      <FooterSection />
    </div>
  );
}
