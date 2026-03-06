import { NextResponse } from "next/server"
import { ADMIN_AUTH_COOKIE_NAME, adminAuthCookieOptions } from "@/app/_lib/admin-auth"

export async function POST() {
  const response = NextResponse.json({ message: "logout successful" }, { status: 200 })

  response.cookies.set(ADMIN_AUTH_COOKIE_NAME, "", {
    ...adminAuthCookieOptions,
    maxAge: 0,
  })

  return response
}
