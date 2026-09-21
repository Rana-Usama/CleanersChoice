import {AdminModule} from '../types/admin';


export const ADMIN_MODULES: AdminModule[] = [
  {
    key: 'postJob',
    title: 'Post a Job',
    subtitle: 'Create a new job listing',
    icon: 'briefcase-plus-outline',
    route: 'PostJob',
    enabled: true,
    params: {jobId: null, adminPost: true},
  },
  {
    key: 'activeJobs',
    title: 'Active Jobs',
    subtitle: 'Live jobs across the platform',
    icon: 'briefcase-outline',
    route: 'AdminActiveJobs',
    enabled: true,
    countKey: 'activeJobs',
  },
  {
    key: 'cleanerServices',
    title: 'Cleaning Services',
    subtitle: 'All services added by cleaners',
    icon: 'shield-check',
    route: 'AdminCleanerServices',
    enabled: true,
    countKey: 'cleanerServices',
  },
];


export const SERVICE_TYPE_LABELS: Record<string, string> = {
  '11': 'Residential Cleaning',
  '22': 'Car Cleaning',
  '33': 'Window Cleaning',
  '44': 'Pressure Washing',
  '55': 'Carpet Cleaning',
  '66': 'Chimney Cleaning',
  '77': 'Lawn Care',
  '88': 'Others',
};

/** "Residential Cleaning · Car Cleaning" — the service's title line. */
export const formatServiceTypes = (types?: string[]): string => {
  if (!Array.isArray(types) || types.length === 0) return 'No services selected';
  return types
    .map(type => SERVICE_TYPE_LABELS[type] ?? type)
    .filter(Boolean)
    .join(' · ');
};
