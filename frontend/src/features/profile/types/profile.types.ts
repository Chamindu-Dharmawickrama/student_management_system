export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  photoUrl: string | null;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
