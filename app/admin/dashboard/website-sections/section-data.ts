// sections.ts

// Add hero section to available website sections
export const availableSections = [
  // ...existing code...
  { id: 'dynamic-hero-section', name: 'Dynamic Hero Sections', description: 'Displays hero sections created in the admin panel' },
];

// Add individual hero sections based on those created in the admin
export const addDynamicHeroSectionsToAvailable = (heroSections: any[]) => {
  const heroSectionItems = heroSections.map(section => ({
    id: `dynamic-hero-section-${section._id}`,
    name: `Hero: ${section.title.substring(0, 20)}${section.title.length > 20 ? '...' : ''}`,
    description: section.subtitle.substring(0, 40) + (section.subtitle.length > 40 ? '...' : ''),
    heroSectionId: section._id
  }));
  
  return [...availableSections, ...heroSectionItems];
};