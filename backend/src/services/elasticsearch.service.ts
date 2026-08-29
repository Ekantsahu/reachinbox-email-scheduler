import { elasticsearch } from "../config/elasticsearch.js";
const EMAIL_INDEX = "emails";

export async function createEmailIndex() {
  const exists = await elasticsearch.indices.exists({
    index: EMAIL_INDEX,
  });

  if (!exists) {
    await elasticsearch.indices.create({
      index: EMAIL_INDEX,
      mappings: {
        properties: {
          id: { type: "keyword" },
          campaignId: { type: "keyword" },
          senderId: { type: "keyword" },
          recipient: { type: "text" },
          subject: { type: "text" },
          body: { type: "text" },
          status: { type: "keyword" },
          scheduledAt: { type: "date" },
          sentAt: { type: "date" },
          createdAt: { type: "date" },
          updatedAt: { type: "date" },
        },
      },
    });

    console.log("Elasticsearch email index created");
  }
}

export async function indexEmail(email: {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: Date;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  await elasticsearch.index({
    index: EMAIL_INDEX,
    id: email.id,
    document: {
      id: email.id,
      campaignId: email.campaignId,
      senderId: email.senderId,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt,
    },
  });
}

export async function searchEmails(query: string) {
  const response = await elasticsearch.search({
    index: EMAIL_INDEX,
    query: {
      multi_match: {
        query,
        fields: [
          "recipient",
          "subject",
          "body",
        ],
      },
    },
  });

  return response.hits.hits.map((hit) => hit._source);
}