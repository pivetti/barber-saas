import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  shouldRenewAuthToken,
  signAuthToken,
  verifyAuthToken,
} from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    const payload = verifyAuthToken(token ?? "")

    if (!payload) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 },
      )
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
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 },
      )
    }

    const response = NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
      },
      { status: 200 },
    )

    if (shouldRenewAuthToken(payload)) {
      const renewedToken = signAuthToken({
        sub: user.id,
        name: user.name,
        phone: user.phone,
        sessionVersion: user.sessionVersion,
        refreshUntil: payload.refreshUntil,
      })

      response.cookies.set(AUTH_COOKIE_NAME, renewedToken, authCookieOptions)
    }

    return response
  } catch {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 },
    )
  }
}
