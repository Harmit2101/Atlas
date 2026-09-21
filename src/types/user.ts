import { UserRole, BuyerStatus } from './commercial';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role?: UserRole;
  buyerStatus?: BuyerStatus;
  createdAt: string;
  isDemo?: boolean;
}

export type AuthMode = 'cloud' | 'demo';

export type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  authMode: AuthMode;
};

