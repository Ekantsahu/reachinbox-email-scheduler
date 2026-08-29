import { redisConnection } from "../config/redis.js";

const MAX_EMAILS_PER_HOUR =
  Number(process.env.MAX_EMAILS_PER_HOUR) || 200;

const MIN_EMAIL_DELAY_MS =
  Number(process.env.MIN_EMAIL_DELAY_MS) || 2000;

/**
 * Atomically consumes one email slot from the current hour.
 *
 * The counter is stored in Redis, so the limit is shared across
 * multiple workers / worker instances.
 */
export async function consumeHourlySlot(): Promise<{
  allowed: boolean;
  retryAfterMs: number;
}> {
  const now = new Date();

  const hourStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
  );

  const hourKey = `email-rate:${hourStart.getTime()}`;

  const script = `
    local current = redis.call("GET", KEYS[1])

    if not current then
      current = 0
    end

    current = tonumber(current)

    if current >= tonumber(ARGV[1]) then
      return 0
    end

    redis.call("INCR", KEYS[1])
    redis.call("EXPIRE", KEYS[1], 7200)

    return 1
  `;

  const result = await redisConnection.eval(
    script,
    1,
    hourKey,
    MAX_EMAILS_PER_HOUR,
  );

  if (Number(result) === 1) {
    return {
      allowed: true,
      retryAfterMs: 0,
    };
  }

  const nextHour = new Date(
    hourStart.getTime() + 60 * 60 * 1000,
  );

  return {
    allowed: false,
    retryAfterMs: Math.max(
      1000,
      nextHour.getTime() - now.getTime(),
    ),
  };
}

/**
 * Ensures that only one Slack rate-limit notification is sent
 * for a particular hourly window.
 *
 * Redis SET NX makes this safe across multiple workers.
 */
export async function claimRateLimitNotification(): Promise<boolean> {
  const now = new Date();

  const hourStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
  );

  const notificationKey =
    `email-rate-notified:${hourStart.getTime()}`;

  const result = await redisConnection.set(
    notificationKey,
    "1",
    "EX",
    7200,
    "NX",
  );

  return result === "OK";
}

/**
 * Reserves the next available global email-send slot.
 *
 * This is different from scheduling:
 * it controls the actual call to sendEmail().
 *
 * Redis makes this safe when multiple workers are running.
 */
export async function acquireSendSlot(): Promise<number> {
  const key = "email-send-next-slot";

  const script = `
    local currentTime = redis.call("TIME")

    local nowMs =
      (tonumber(currentTime[1]) * 1000) +
      math.floor(tonumber(currentTime[2]) / 1000)

    local lastSlot = redis.call("GET", KEYS[1])

    if not lastSlot then
      lastSlot = nowMs
    else
      lastSlot = tonumber(lastSlot)
    end

    local nextSlot = math.max(nowMs, lastSlot)
    local waitMs = math.max(0, nextSlot - nowMs)

    local reservedSlot = nextSlot + tonumber(ARGV[1])

    redis.call(
      "SET",
      KEYS[1],
      tostring(reservedSlot),
      "PX",
      7200000
    )

    return waitMs
  `;

  const result = await redisConnection.eval(
    script,
    1,
    key,
    MIN_EMAIL_DELAY_MS,
  );

  return Number(result);
}