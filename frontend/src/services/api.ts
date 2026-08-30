import type {
  Email,
  ScheduleEmailRequest,
  ScheduleEmailResponse,
  SearchEmailsResponse,
} from "../types/email";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://reachinbox-email-scheduler-28b1.onrender.com/api";

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function scheduleEmails(
  data: ScheduleEmailRequest,
): Promise<ScheduleEmailResponse> {
  return apiRequest<ScheduleEmailResponse>("/emails/schedule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function searchEmails(
  query: string,
): Promise<SearchEmailsResponse> {
  return apiRequest<SearchEmailsResponse>(
    `/emails/search?q=${encodeURIComponent(query)}`,
  );
}

export async function getScheduledEmails(
  userId: string,
): Promise<{ emails: Email[] }> {
  return apiRequest<{ emails: Email[] }>(
    `/emails/scheduled?userId=${encodeURIComponent(userId)}`,
  );
}

export async function getSentEmails(
  userId: string,
): Promise<{ emails: Email[] }> {
  return apiRequest<{ emails: Email[] }>(
    `/emails/sent?userId=${encodeURIComponent(userId)}`,
  );
}

export async function getEmails(
  status?: "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED",
): Promise<SearchEmailsResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";

  return apiRequest<SearchEmailsResponse>(`/emails${query}`);
}


export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface CurrentUserResponse {
  user: CurrentUser;
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>("/auth/me");
}

export async function logout(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "GET",
  });
}