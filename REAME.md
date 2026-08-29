# ReachInbox Email Scheduler

A full-stack email scheduling application that allows authenticated users to schedule and send emails using a persistent BullMQ queue with Redis-backed rate limiting.

The system supports delayed email delivery, configurable worker concurrency, hourly email limits, Google authentication, Slack OAuth notifications, PostgreSQL persistence, Elasticsearch indexing, and Ethereal SMTP for testing.

---

## Features

- Google OAuth authentication
- Schedule emails for a future date and time
- Bulk email scheduling
- Persistent BullMQ delayed jobs
- Configurable worker concurrency
- Configurable minimum scheduling delay
- Redis-backed hourly rate limiting
- Automatic retry after an hourly rate limit is reached
- Slack OAuth integration
- Slack rate-limit notifications
- Slack success/failure notifications
- PostgreSQL persistence with Prisma
- Email status tracking
- Email idempotency
- Elasticsearch indexing
- Ethereal SMTP integration for safe email testing
- No cron jobs

---

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

### Queue and Infrastructure

- BullMQ
- Redis
- Elasticsearch

### Authentication and Integrations

- Google OAuth
- Slack OAuth
- Nodemailer
- Ethereal Email

---

# Architecture

The application uses PostgreSQL as the primary database and Redis + BullMQ for persistent background job processing.

The basic flow is:

```text
User
 │
 ▼
React Frontend
 │
 ▼
Express API
 │
 ├── Google OAuth
 │
 ├── Slack OAuth
 │
 ▼
PostgreSQL
 │
 ├── Users
 ├── Senders
 ├── Campaigns
 └── Emails
 │
 ▼
BullMQ + Redis
 │
 ▼
Email Worker
 │
 ├── Redis Rate Limiter
 ├── Nodemailer / Ethereal
 ├── Elasticsearch
 └── Slack Notification
```

---

# Email Scheduling

When a user schedules a campaign, the backend:

1. Validates the scheduling request.
2. Creates or updates the sender.
3. Creates a campaign in PostgreSQL.
4. Creates individual email records.
5. Calculates the `scheduledAt` time for every email.
6. Adds every email to BullMQ as a delayed job.

Each email has its own BullMQ job.

Example:

```text
Campaign
   │
   ├── Email 1 → BullMQ delayed job
   ├── Email 2 → BullMQ delayed job
   ├── Email 3 → BullMQ delayed job
   └── Email 4 → BullMQ delayed job
```

BullMQ handles when the jobs become available to the worker.

No cron scheduler is used.

---

# Worker Concurrency

The worker uses configurable concurrency.

Current configuration:

```env
WORKER_CONCURRENCY=5
```

This allows up to five jobs to be processed concurrently by the worker.

The worker is created using BullMQ's concurrency option:

```ts
concurrency: Number(process.env.WORKER_CONCURRENCY) || 5
```

Because the email state is stored in PostgreSQL and the rate limit is stored in Redis, the system does not depend on an in-memory counter.

---

# Minimum Email Delay

The application supports a configurable minimum delay:

```env
MIN_EMAIL_DELAY_MS=2000
```

The scheduler ensures that the requested delay cannot be lower than this configured minimum.

For example:

```text
Requested delay: 500ms
Minimum delay: 2000ms

Actual delay: 2000ms
```

The current demo configuration therefore uses a minimum scheduling delay of:

**2 seconds**

---

# Hourly Rate Limiting

The application uses a Redis-backed hourly rate limiter.

Current configuration:

```env
MAX_EMAILS_PER_HOUR=5
```

The limit can be changed through the environment configuration without modifying the source code.

The rate limiter uses a Redis key for the current hourly window:

```text
email-rate:{hourStart}
```

The counter is incremented atomically using a Redis Lua script.

This is important because multiple worker processes or instances can share the same Redis counter instead of maintaining separate in-memory counters.

---

# Rate Limit Behavior

When the configured hourly limit has not been reached:

```text
Worker
  ↓
Redis rate-limit check
  ↓
Slot available
  ↓
Send email
  ↓
Mark email as SENT
```

When the hourly limit has been reached:

```text
Worker
  ↓
Redis rate-limit check
  ↓
Limit reached
  ↓
Send Slack notification
  ↓
Calculate remaining time until next hour
  ↓
Throw RateLimitError
  ↓
BullMQ retry/backoff
  ↓
Try the email again in the next hourly window
```

The email is **not permanently discarded** because of the rate limit.

---

# Rate Limit Example

With:

```env
MAX_EMAILS_PER_HOUR=5
```

if more than five emails become available during the same hourly window:

```text
Email 1 → Sent
Email 2 → Sent
Email 3 → Sent
Email 4 → Sent
Email 5 → Sent

Email 6 → Rate limited
Email 7 → Rate limited
Email 8 → Rate limited
...
```

The rate-limited jobs are retried after the remaining time in the current hourly window.

For example, the worker may log:

```text
Hourly rate limit reached for job email-123.
Retrying after 1619 seconds.
Slack rate-limit notification sent.
```

This means the worker detected that the hourly limit had been reached, notified the user through Slack, and scheduled the job for another attempt in the next hourly window.

---

# Redis Rate Limiter

The rate limiter is implemented using a Redis Lua script.

The operation is atomic:

```text
GET current counter
       ↓
Check configured limit
       ↓
If available
       ↓
INCR counter
       ↓
Set expiration
       ↓
Allow email
```

If the counter has already reached the configured limit:

```text
Reject current attempt
       ↓
Calculate next hourly window
       ↓
Return retry delay
```

The Redis key expires after two hours to prevent unused rate-limit keys from remaining indefinitely.

---

# Slack Integration

Slack is integrated using OAuth.

The user can connect Slack from the application.

The OAuth flow is:

```text
Dashboard
   ↓
Connect Slack
   ↓
Slack OAuth authorization
   ↓
Slack callback
   ↓
Access token received
   ↓
Token stored in PostgreSQL
```

The Slack connection is associated with the authenticated Google user.

The database stores:

- Slack access token
- Slack workspace/team ID
- Slack workspace/team name
- Slack user ID

---

# Slack Notifications

Slack notifications are sent using the user's stored OAuth access token.

The application sends notifications for:

- Successful email sends
- Failed email sends
- Hourly rate-limit events

For rate limiting, the worker sends a Slack message immediately when the hourly limit is detected.

Example:

```text
Hourly rate limit reached
        ↓
Slack notification
        ↓
Email job delayed
```

If Slack has not been connected, the notification is skipped and email processing continues normally.

Slack errors are also isolated from email processing so that a Slack failure does not cause an otherwise successful email to fail.

---

# Email Processing

When BullMQ gives an email job to the worker, the worker:

1. Loads the email from PostgreSQL.
2. Checks whether the email has already been sent.
3. Checks the Redis hourly rate limit.
4. Marks the email as `PROCESSING`.
5. Sends the email through Nodemailer.
6. Stores the SMTP message ID.
7. Marks the email as `SENT`.
8. Indexes the updated email in Elasticsearch.
9. Sends a Slack success notification.

---

# Idempotency

The worker performs an idempotency check before sending:

```ts
if (email.status === "SENT") {
  return;
}
```

This prevents an email that has already been successfully sent from being sent again if its BullMQ job is processed again.

The database therefore remains the source of truth for the email's final state.

---

# Email Statuses

Each email can have one of four statuses:

```text
SCHEDULED
PROCESSING
SENT
FAILED
```

### SCHEDULED

The email has been created and is waiting for its scheduled time.

### PROCESSING

The worker has started processing the email.

### SENT

The email was successfully delivered to the configured SMTP server.

### FAILED

The email could not be sent because of an email-processing error.

---

# PostgreSQL Data Model

The main database entities are:

```text
User
 │
 ├── Sender
 │      │
 │      ├── Campaign
 │      │      │
 │      │      └── Email
 │      │
 │      └── Email
 │
 └── SlackConnection
```

Prisma is used for database access and PostgreSQL stores the persistent application state.

---

# Elasticsearch

Emails are indexed in Elasticsearch after their status is updated.

This allows email records to be indexed separately from the primary PostgreSQL database.

The Elasticsearch service is used after:

- Email is successfully sent
- Email processing fails

---

# Persistence and Restart Behavior

The scheduler does not use cron jobs.

Instead, scheduled emails are represented as BullMQ delayed jobs backed by Redis.

The email state is stored in PostgreSQL.

This means the application does not depend on an in-memory JavaScript timer for future email delivery.

The intended architecture is:

```text
Schedule email
      ↓
PostgreSQL email record
      ↓
BullMQ delayed job
      ↓
Redis persistence
      ↓
Worker
      ↓
Send email
```

After a worker restart, pending BullMQ jobs remain available for processing.

---

# No Cron Jobs

The application does not use:

- OS-level cron
- `node-cron`
- `agenda`
- Scheduled polling loops
- In-memory timers for email scheduling

Email scheduling is handled through BullMQ delayed jobs.

---

# Handling Large Batches

The system is designed to accept large batches of scheduled emails.

For example, if 1000 emails are scheduled for approximately the same time:

```text
1000 scheduled emails
        ↓
1000 PostgreSQL email records
        ↓
1000 BullMQ delayed jobs
        ↓
Worker concurrency controls processing
        ↓
Redis controls hourly throughput
        ↓
Rate-limited jobs retry in later windows
```

The worker does not need to process all 1000 emails simultaneously.

BullMQ keeps jobs waiting while the worker processes them according to the configured concurrency and rate-limit rules.

The actual throughput depends on:

- Worker concurrency
- Email provider limits
- Minimum delay configuration
- Hourly rate limit
- SMTP response time

---

# Configuration

The main configuration values are controlled using environment variables.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5433/reachinbox"

REDIS_HOST="localhost"
REDIS_PORT="6379"

WORKER_CONCURRENCY=5
MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=5

SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="YOUR_ETHEREAL_USER"
SMTP_PASSWORD="YOUR_ETHEREAL_PASSWORD"
SMTP_FROM="ReachInbox <YOUR_EMAIL>"

ELASTICSEARCH_URL="http://localhost:9200"

GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="YOUR_GOOGLE_CALLBACK_URL"

SLACK_CLIENT_ID="YOUR_SLACK_CLIENT_ID"
SLACK_CLIENT_SECRET="YOUR_SLACK_CLIENT_SECRET"
SLACK_REDIRECT_URI="YOUR_SLACK_REDIRECT_URI"
```

Do not commit real credentials, OAuth secrets, SMTP passwords, or Slack tokens to Git.

---

# Running the Project

## 1. Start PostgreSQL

Make sure PostgreSQL is running and the configured database exists.

## 2. Start Redis

Make sure Redis is running on the configured host and port.

Default:

```text
localhost:6379
```

## 3. Start Elasticsearch

The default configuration expects:

```text
http://localhost:9200
```

## 4. Start the Backend

```bash
cd backend
npm install
npm run dev
```

## 5. Start the Email Worker

Open another terminal:

```bash
cd backend
npm run worker
```

Expected output:

```text
Email worker started
```

## 6. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

---

# Testing

## Email Scheduling

1. Log in with Google.
2. Compose an email.
3. Add one or more recipients.
4. Select a future start time.
5. Configure the delay and hourly limit.
6. Schedule the campaign.
7. Verify that the emails initially appear as `SCHEDULED`.
8. Wait for their BullMQ jobs to become available.
9. Verify that successfully processed emails become `SENT`.

---

## Rate Limit Testing

For a simple demonstration:

```env
MAX_EMAILS_PER_HOUR=5
```

Schedule more than five emails.

The worker should process emails until the hourly limit is reached.

Additional jobs should produce output similar to:

```text
Hourly rate limit reached for job ...
Retrying after ... seconds.
Slack rate-limit notification sent.
```

The rate-limited job is then retried during the next hourly window.

---

## Slack Testing

1. Log in using Google.
2. Click `Connect Slack`.
3. Authorize the Slack application.
4. Confirm the Slack connection in the dashboard.
5. Trigger an hourly rate-limit event.
6. Verify that a Slack notification is received.

Slack can be disconnected and reconnected without redeploying the application.

---

# Security

Environment variables containing credentials must not be committed to the repository.

Add the following to `.gitignore`:

```gitignore
.env
node_modules/
dist/
```

OAuth secrets, SMTP credentials, database passwords, and Slack tokens should always remain in environment variables.

---

# Current Demo Configuration

The current demo uses:

```text
Worker concurrency: 5
Minimum scheduling delay: 2 seconds
Maximum emails per hour: 5
Redis: localhost:6379
Elasticsearch: localhost:9200
SMTP: Ethereal
```

The low hourly limit of `5` is intentionally useful for demonstrating the rate-limiting and Slack notification behavior.

For production usage, the limit can be increased through:

```env
MAX_EMAILS_PER_HOUR
```

---

# Design Decisions

### BullMQ delayed jobs

BullMQ was chosen to handle future email scheduling without cron jobs.

### Redis

Redis provides persistent queue infrastructure and shared atomic rate-limit counters.

### PostgreSQL

PostgreSQL stores the authoritative state of users, campaigns, senders, and emails.

### Redis Lua script

A Lua script makes the hourly counter check and increment atomic, which is important when multiple workers process jobs concurrently.

### Slack OAuth

Slack OAuth allows each authenticated user to connect their own Slack workspace instead of relying on one global Slack channel configuration.

### Idempotency

The database status is checked before sending to avoid duplicate email delivery from repeated job processing.

---

# Limitations / Trade-offs

The current rate limiter uses a global hourly Redis counter.

The key is based on the hourly window:

```text
email-rate:{hourStart}
```

Therefore, the current implementation applies the configured hourly limit across the worker system rather than maintaining a separate counter for every sender.

The scheduler calculates email times in hourly batches based on the campaign's configured hourly limit.

The actual email throughput is also affected by worker concurrency and SMTP response time.

---

# Project Goal

The goal of this project is to demonstrate a persistent, queue-based email scheduling system capable of handling delayed jobs, concurrent processing, Redis-backed rate limiting, retry behavior, authentication, external integrations, and reliable email state management.