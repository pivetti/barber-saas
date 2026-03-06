import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_COOKIE_NAME = "auth_token"
const ADMIN_AUTH_COOKIE_NAME = "admin_auth_token"

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminArea = pathname.startsWith("/admin")
  const isAdminLogin = pathname === "/admin/login"

  const token = request.cookies.get(
    isAdminArea ? ADMIN_AUTH_COOKIE_NAME : AUTH_COOKIE_NAME,
  )?.value
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    const loginPath = isAdminArea ? "/admin/login" : "/login"
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!token) {
    if (isAdminLogin) {
      return NextResponse.next()
    }

    const loginPath = isAdminArea ? "/admin/login" : "/login"
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyJwt(token, jwtSecret)
  if (!payload?.sub) {
    if (isAdminLogin) {
      return NextResponse.next()
    }

    const loginPath = isAdminArea ? "/admin/login" : "/login"
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminLogin) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/bookings/:path*", "/admin/:path*"],
}
