import "server-only"
import { db } from "./prisma"
import { sanitizeText } from "./input-validation"

type PublicRateLimitRoute =
  | "create-booking"
  | "manage-booking-by-token"
  | "get-booking-day-context"

interface RateLimitConfig {
  maxAttempts: number
  windowMinutes: number
  baseBlockMinutes: number
}

interface CheckRateLimitResult {
  allowed: boolean
  retryAfter?: number
}

const RATE_LIMIT_CONFIGS: Record<PublicRateLimitRoute, RateLimitConfig> = {
  "create-booking": {
    maxAttempts: 60,
    windowMinutes: 10,
    baseBlockMinutes: 20,
  },
  "manage-booking-by-token": {
    maxAttempts: 40,
    windowMinutes: 10,
    baseBlockMinutes: 20,
  },
  "get-booking-day-context": {
    maxAttempts: 120,
    windowMinutes: 10,
    baseBlockMinutes: 20,
  },
}

export class RateLimitExceededError extends Error {
  statusCode: number
  retryAfter: number
  route: string

  constructor(route: string, retryAfter: number) {
    super("Too many requests, try again later")
    this.name = "RateLimitExceededError"
    this.statusCode = 429
    this.retryAfter = retryAfter
    this.route = route
  }
}

const calculateRetryAfterSeconds = (blockedUntil: Date) => {
  return Math.max(1, Math.ceil((blockedUntil.getTime() - Date.now()) / 1000))
}

const calculateBlockMinutes = (config: RateLimitConfig, nextAttemptCount: number) => {
  const overflow = Math.max(0, nextAttemptCount - config.maxAttempts)
  const level = 1 + Math.floor(overflow / config.maxAttempts)
  return Math.min(config.baseBlockMinutes * level, 24 * 60)
}

export const checkRateLimit = async (
  ipAddress: string,
  route: PublicRateLimitRoute,
): Promise<CheckRateLimitResult> => {
  const config = RATE_LIMIT_CONFIGS[route]
  const normalizedIp = sanitizeText(ipAddress).slice(0, 64) || "unknown"
  const now = new Date()
  const windowMs = config.windowMinutes * 60 * 1000

  return db.$transaction(async (tx) => {
    const current = await tx.rateLimitAttempt.upsert({
      where: {
        ipAddress_route: {
          ipAddress: normalizedIp,
          route,
        },
      },
      create: {
        ipAddress: normalizedIp,
        route,
        attemptCount: 0,
        windowStartedAt: now,
      },
      update: {},
    })

    if (current.blockedUntil && current.blockedUntil > now) {
      const retryAfter = calculateRetryAfterSeconds(current.blockedUntil)
      console.warn(`[rate-limit-blocked] route=${route} ip=${normalizedIp} retryAfter=${retryAfter}s`)
      return { allowed: false, retryAfter }
    }

    const isOutsideWindow = now.getTime() - current.windowStartedAt.getTime() > windowMs
    if (isOutsideWindow) {
      await tx.rateLimitAttempt.update({
        where: {
          ipAddress_route: {
            ipAddress: normalizedIp,
            route,
          },
        },
        data: {
          attemptCount: 1,
          windowStartedAt: now,
          blockedUntil: null,
        },
      })

      return { allowed: true }
    }

    const nextAttemptCount = current.attemptCount + 1
    const shouldBlock = nextAttemptCount > config.maxAttempts

    if (!shouldBlock) {
      await tx.rateLimitAttempt.update({
        where: {
          ipAddress_route: {
            ipAddress: normalizedIp,
            route,
          },
        },
        data: {
          attemptCount: nextAttemptCount,
          blockedUntil: null,
        },
      })

      return { allowed: true }
    }

    const blockMinutes = calculateBlockMinutes(config, nextAttemptCount)
    const blockedUntil = new Date(now.getTime() + blockMinutes * 60 * 1000)
    const retryAfter = calculateRetryAfterSeconds(blockedUntil)

    await tx.rateLimitAttempt.update({
      where: {
        ipAddress_route: {
          ipAddress: normalizedIp,
          route,
        },
      },
      data: {
        attemptCount: nextAttemptCount,
        blockedUntil,
      },
    })

    console.warn(
      `[rate-limit-triggered] route=${route} ip=${normalizedIp} attempts=${nextAttemptCount} blockMinutes=${blockMinutes} retryAfter=${retryAfter}s`,
    )

    return {
      allowed: false,
      retryAfter,
    }
  })
}

export const enforceRateLimit = async (
  ipAddress: string,
  route: PublicRateLimitRoute,
) => {
  const result = await checkRateLimit(ipAddress, route)
  if (!result.allowed) {
    throw new RateLimitExceededError(route, result.retryAfter ?? 60)
  }
}
