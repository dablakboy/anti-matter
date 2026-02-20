/** Device compatibility: iPhone only, iPad only, or both */
export type DeviceCompatibility = 'iphone' | 'ipad' | 'both';

export interface IPAApp {
  id: string;
  name: string;
  developerName: string;
  icon: string;
  description: string;
  version: string;
  size: string;
  category: AppCategory;
  downloads: number;
  rating: number;
  ipaUrl: string;
  /** Supabase storage path - when set, download URL is fetched from backend */
  ipaPath?: string;
  /** Device compatibility - defaults to 'both' */
  device?: DeviceCompatibility;
  certificateUrl?: string;
  screenshots: string[];
  iosVersionRequired: string;
  lastUpdated: string;
  /** App status: approved (downloadable) or pending (review, 48h lockout) */
  status?: 'approved' | 'pending';
  /** ISO string - used for 48h countdown when pending */
  createdAt?: string;
  /** true when current device uploaded this app (from API) */
  canDelete?: boolean;
  socialLinks?: {
    twitter?: string;
    website?: string;
    discord?: string;
  };
  appStoreLink?: string;
  isFeatured?: boolean;
}

export type AppCategory =
  | 'games'
  | 'entertainment'
  | 'health'
  | 'weather'
  | 'finance'
  | 'home'
  | 'music'
  | 'sports'
  | 'education'
  | 'travel'
  | 'utilities'
  | 'social';

export interface Developer {
  id: string;
  name: string;
  avatar?: string;
  appsCount: number;
  totalDownloads: number;
  joinedDate: string;
  socialLinks?: {
    twitter?: string;
    website?: string;
    discord?: string;
  };
}

export const CATEGORIES: { id: AppCategory; name: string; icon: string }[] = [
  { id: 'games', name: 'Games', icon: 'Gamepad2' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Tv' },
  { id: 'health', name: 'Health', icon: 'Heart' },
  { id: 'weather', name: 'Weather', icon: 'Cloud' },
  { id: 'finance', name: 'Finance', icon: 'DollarSign' },
  { id: 'home', name: 'Home', icon: 'Home' },
  { id: 'music', name: 'Music', icon: 'Music' },
  { id: 'sports', name: 'Sports', icon: 'Trophy' },
  { id: 'education', name: 'Education', icon: 'GraduationCap' },
  { id: 'travel', name: 'Travel', icon: 'Plane' },
  { id: 'utilities', name: 'Utilities', icon: 'Wrench' },
  { id: 'social', name: 'Social', icon: 'Users' },
];
