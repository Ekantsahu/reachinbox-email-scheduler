export type EmailStatus =
  | "SCHEDULED"
  | "PROCESSING"
  | "SENT"
  | "FAILED";

export interface Email {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  messageId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEmailRequest {
  userId: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
}

export interface ScheduleEmailResponse {
  message: string;
  campaignId: string;
  emails: Email[];
}

export interface SearchEmailsResponse {
  query: string;
  count: number;
  emails: Email[];
}