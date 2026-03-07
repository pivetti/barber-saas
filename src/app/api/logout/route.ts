import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, authCookieOptions, verifyAuthToken } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (token) {
    const payload = verifyAuthToken(token)
    if (payload?.sub) {
      await db.user.updateMany({
        where: { id: payload.sub },
        data: {
          sessionVersion: { increment: 1 },
        },
      })
    }
  }

  const response = NextResponse.json(
    { message: "logout successful" },
    { status: 200 },
  )

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...authCookieOptions,
    maxAge: 0,
  })

  return response
}
