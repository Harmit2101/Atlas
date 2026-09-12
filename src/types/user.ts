import { UserRole, BuyerStatus } from './commercial';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role?: UserRole;
  buyerStatus?: BuyerStatus;
  createdAt: string;
}

export type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
};
