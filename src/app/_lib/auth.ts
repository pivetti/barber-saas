import { cookies } from "next/headers"
import jwt, { JwtPayload } from "jsonwebtoken"
import { getAppEnv } from "./env"
import { db } from "./prisma"

export const AUTH_COOKIE_NAME = "auth_token"
export const AUTH_EXPIRES_IN_SECONDS = 60 * 15
export const AUTH_COOKIE_MAX_AGE_SECONDS = AUTH_EXPIRES_IN_SECONDS
export const AUTH_RENEW_BEFORE_EXPIRY_SECONDS = 60 * 5
export const AUTH_REFRESH_WINDOW_SECONDS = 60 * 60 * 8

export interface AuthTokenPayload extends JwtPayload {
  sub: string
  name: string
  phone: string
  sessionVersion: number
  refreshUntil: number
}

export interface AuthUser {
  id: string
  name: string
  phone: string
}

const getJwtSecret = () => {
  return getAppEnv().JWT_SECRET
}

export const signAuthToken = (payload: AuthTokenPayload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: AUTH_EXPIRES_IN_SECONDS,
  })
}

export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret())

    if (typeof decoded === "string") {
      return null
    }

    if (!decoded.sub || !decoded.name || !decoded.phone) {
      return null
    }

    if (
      typeof decoded.sessionVersion !== "number" ||
      typeof decoded.refreshUntil !== "number"
    ) {
      return null
    }

    return decoded as AuthTokenPayload
  } catch {
    return null
  }
}

export const getUserFromToken = async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = verifyAuthToken(token)
  if (!payload) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      phone: true,
      sessionVersion: true,
    },
  })

  if (!user || user.sessionVersion !== payload.sessionVersion) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
  }
}

export const shouldRenewAuthToken = (payload: AuthTokenPayload) => {
  const nowInSeconds = Math.floor(Date.now() / 1000)

  if (!payload.exp || payload.refreshUntil <= nowInSeconds) {
    return false
  }

  const remainingLifetime = payload.exp - nowInSeconds
  return remainingLifetime <= AUTH_RENEW_BEFORE_EXPIRY_SECONDS
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
}
