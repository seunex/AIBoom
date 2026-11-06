export function resendFrom(): string;
export function mailConfigured(): boolean;
export function sendMail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}): Promise<{ ok: boolean; reason?: string }>;
