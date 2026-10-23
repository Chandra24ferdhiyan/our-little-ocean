export type FishRole = 'candut' | 'repa';

export type MessageStatus = 'pending' | 'read';

export type MessageCategory = 'love' | 'gratitude' | 'memory' | 'promise' | 'daily';

export type TransactionType = 
  | 'daily_claim' 
  | 'feed' 
  | 'secret_02' 
  | 'secret_03' 
  | 'secret_04' 
  | 'secret_05' 
  | 'bonus';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  partner_role: FishRole; // 'candut' (mist gray) or 'repa' (soft pink)
  created_at: string;
}

export interface Couple {
  id: string;
  partner_one_id: string;
  partner_two_id: string | null;
  invitation_code: string;
  anniversary_date?: string;
  created_at: string;
  partner_one?: UserProfile;
  partner_two?: UserProfile;
}

export interface AquariumData {
  id: string;
  couple_id: string;
  current_level: number; // 1 - 500
  current_xp: number;
  pellet_balance: number;
  active_theme: string; // 'ocean-dream' | 'love-lagoon' | 'zen-garden' | 'midnight-ocean' | 'sunset-bay'
  created_at: string;
  updated_at: string;
}

export interface PelletTransaction {
  id: string;
  aquarium_id: string;
  actor_id: string;
  transaction_type: TransactionType;
  amount: number; // positive for gain, negative for spent
  idempotency_key: string;
  note?: string;
  created_at: string;
}

export interface DailyClaim {
  id: string;
  aquarium_id: string;
  user_id: string;
  claim_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface BubbleMessage {
  id: string;
  aquarium_id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  sender_role: FishRole;
  message: string;
  bubble_color: string; // 'bubble-rose' | 'bubble-teal' | 'bubble-lavender' | 'bubble-amber'
  category: MessageCategory;
  status: MessageStatus;
  x_pos: number; // 5% - 95%
  y_pos: number; // 10% - 85%
  drift_speed: number;
  created_at: string;
  read_at?: string | null;
}

export interface ThemeConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bgGradient: string;
  waterTint: string;
  causticsColor: string;
  sandGradient: string;
  accentColor: string;
  particleColor: string;
  ambientLight: string;
  previewBg: string;
  surfaceLight: string;
  bgImage: string;
}

export interface LevelMilestone {
  stage: number; // 1 to 5
  levelRange: [number, number];
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  unlockedFeatures: string[];
}

export interface SecretReward {
  id: TransactionType;
  title: string;
  pellets: number;
  cooldownHours: number;
  badge: string;
  description: string;
}
