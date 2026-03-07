import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_AUTH_COOKIE_NAME = "admin_auth_token"
const ADMIN_AUTH_EXPIRES_IN_SECONDS = 60 * 15
const ADMIN_AUTH_RENEW_BEFORE_EXPIRY_SECONDS = 60 * 5

const encoder = new TextEncoder()

const base64UrlToUint8Array = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalized = base64 + padding
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

const decodePayload = (value: string) => {
  const bytes = base64UrlToUint8Array(value)
  return new TextDecoder().decode(bytes)
}

const uint8ArrayToBase64Url = (value: Uint8Array) => {
  let binary = ""

  for (const byte of value) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

const encodeJsonToBase64Url = (value: unknown) => {
  const json = JSON.stringify(value)
  return uint8ArrayToBase64Url(encoder.encode(json))
}

const verifyJwt = async (token: string, secret: string) => {
  const parts = token.split(".")
  if (parts.length !== 3) {
    return null
  }

  const [header, payload, signature] = parts

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  )

  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToUint8Array(signature),
    encoder.encode(`${header}.${payload}`),
  )

  if (!isValidSignature) {
    return null
  }

  const parsedPayload = JSON.parse(decodePayload(payload))
  if (parsedPayload?.exp && Date.now() >= parsedPayload.exp * 1000) {
    return null
  }

  return parsedPayload
}

const signJwt = async (payload: Record<string, unknown>, secret: string) => {
  const header = encodeJsonToBase64Url({ alg: "HS256", typ: "JWT" })
  const body = encodeJsonToBase64Url(payload)

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`))
  const encodedSignature = uint8ArrayToBase64Url(new Uint8Array(signature))

  return `${header}.${body}.${encodedSignature}`
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminLogin = pathname === "/admin/login"

  const token = request.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!token) {
    if (isAdminLogin) {
      return NextResponse.next()
    }

    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJwt(token, jwtSecret)
  if (!payload?.sub) {
    if (isAdminLogin) {
      return NextResponse.next()
    }

    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminLogin) {
    return NextResponse.next()
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  const exp = typeof payload.exp === "number" ? payload.exp : 0
  const refreshUntil = typeof payload.refreshUntil === "number" ? payload.refreshUntil : 0
  const shouldRenew =
    exp > 0 &&
    refreshUntil > nowInSeconds &&
    exp - nowInSeconds <= ADMIN_AUTH_RENEW_BEFORE_EXPIRY_SECONDS

  if (!shouldRenew) {
    return NextResponse.next()
  }

  const renewedToken = await signJwt(
    {
      ...payload,
      iat: nowInSeconds,
      exp: nowInSeconds + ADMIN_AUTH_EXPIRES_IN_SECONDS,
    },
    jwtSecret,
  )

  const response = NextResponse.next()
  response.cookies.set(ADMIN_AUTH_COOKIE_NAME, renewedToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_AUTH_EXPIRES_IN_SECONDS,
  })

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
