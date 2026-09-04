export const AID_CATEGORIES = ['FOOD', 'WATER', 'SHELTER', 'MEDICAL', 'CLOTHING'];

export const CATEGORY_LABELS = {
  FOOD: 'Food',
  WATER: 'Drinking water',
  SHELTER: 'Shelter materials',
  MEDICAL: 'Medical supplies',
  CLOTHING: 'Clothing',
};

export const REQUEST_STATUS = ['PENDING', 'ASSIGNED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
export const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const AMENITIES = [
  'POWER',
  'MEDICAL_UNIT',
  'HALAL_MEALS',
  'PET_FRIENDLY',
  'WHEELCHAIR_ACCESS',
  'DRINKING_WATER',
];

export const AMENITY_LABELS = {
  POWER: 'Power',
  MEDICAL_UNIT: 'Medical unit',
  HALAL_MEALS: 'Halal meals',
  PET_FRIENDLY: 'Pet friendly',
  WHEELCHAIR_ACCESS: 'Wheelchair access',
  DRINKING_WATER: 'Drinking water',
};

export const VOLUNTEER_SKILLS = ['DRIVER', 'FIRST_AID', 'HEAVY_LIFTING', 'COOKING', 'TRANSLATION', 'CHILD_CARE'];

export const SKILL_LABELS = {
  DRIVER: 'Driver',
  FIRST_AID: 'First aid',
  HEAVY_LIFTING: 'Heavy lifting',
  COOKING: 'Cooking',
  TRANSLATION: 'Translation',
  CHILD_CARE: 'Child care',
};

export const TASK_STATUS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const DISPATCH_STATUS = ['DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
export const DONOR_TYPES = ['CITIZEN', 'NGO', 'GOVERNMENT', 'BUSINESS'];
export const SEVERITIES = ['INFO', 'WARNING', 'URGENT'];

export const titleCase = (value = '') =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
