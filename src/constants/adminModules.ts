import {AdminModule} from '../types/admin';

/**
 * The admin hub's module list.
 *
 * Adding a future admin feature = one entry here + one screen registered in
 * StackNavigator. The hub renders straight off this array, so no navigation or
 * UI restructuring is needed as the section grows.
 */
export const ADMIN_MODULES: AdminModule[] = [
  {
    key: 'activeJobs',
    title: 'Active Jobs',
    subtitle: 'Live jobs posted by customers',
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
  // Future examples — add an entry and a screen, nothing else changes:
  // { key: 'users',    title: 'All Users', subtitle: 'Cleaners and customers',
  //   icon: 'account-group-outline', route: 'AdminUsers',    enabled: true },
  // { key: 'payments', title: 'Payments',  subtitle: 'Subscription revenue',
  //   icon: 'cash-multiple',        route: 'AdminPayments', enabled: true },
];

/**
 * Service category ids as stored in `CleanerServices.type`.
 * Mirrors the maps already inlined in Dashboard.tsx and CleanerProfile.tsx.
 */
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
