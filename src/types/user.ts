export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
};
