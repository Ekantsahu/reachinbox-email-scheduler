import { WebClient } from "@slack/web-api";

export const slackClientId = process.env.SLACK_CLIENT_ID!;
export const slackClientSecret = process.env.SLACK_CLIENT_SECRET!;

export function getSlackClient(accessToken: string) {
  return new WebClient(accessToken);
}