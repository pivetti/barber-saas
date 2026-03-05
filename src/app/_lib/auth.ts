import { cookies } from "next/headers"
import jwt, { JwtPayload } from "jsonwebtoken"
import { db } from "./prisma"

export const AUTH_COOKIE_NAME = "auth_token"
const AUTH_EXPIRES_IN = "7d"
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export interface AuthTokenPayload extends JwtPayload {
  sub: string
  name: string
  phone: string
}

export interface AuthUser {
  id: string
  name: string
  phone: string
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET is not configured")
  }

  return secret
}

export const signAuthToken = (payload: AuthTokenPayload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: AUTH_EXPIRES_IN,
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
    },
  })

  return user
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
}
