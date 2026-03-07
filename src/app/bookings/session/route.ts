import { NextRequest, NextResponse } from "next/server"
import { db } from "@/app/_lib/prisma"
import {
  clearPublicBookingSession,
  createPublicBookingSession,
} from "@/app/_lib/public-booking-session"
import { resolveSafePath } from "@/app/_lib/safe-redirect"

const CANCELLATION_TOKEN_REGEX = /^ct_[a-f0-9]{32}$/i

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? ""
  const nextPath = resolveSafePath(request.nextUrl.searchParams.get("next") ?? undefined, {
    fallback: "/bookings",
    requiredPrefix: "/bookings",
  })

  if (!CANCELLATION_TOKEN_REGEX.test(token)) {
    await clearPublicBookingSession()
    return NextResponse.redirect(new URL(nextPath, request.url))
  }

  const booking = await db.booking.findUnique({
    where: {
      cancellationToken: token,
    },
    select: {
      id: true,
    },
  })

  if (!booking) {
    await clearPublicBookingSession()
    return NextResponse.redirect(new URL(nextPath, request.url))
  }

  await createPublicBookingSession(booking.id)
  return NextResponse.redirect(new URL(nextPath, request.url))
}
