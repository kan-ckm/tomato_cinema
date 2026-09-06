export interface PasswordResetRequestedEvent {
  email: string;
  code: string;
  expiresInMinutes: number;
}
