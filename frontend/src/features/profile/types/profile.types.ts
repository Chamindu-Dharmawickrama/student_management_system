export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  authProvider: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  email?: string;
  avatarUrl?: string;
}
