import { NextResponse } from "next/server"
import { getUserFromToken } from "@/app/_lib/auth"

export async function GET() {
  try {
    const user = await getUserFromToken()

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 },
      )
    }

    return NextResponse.json(
      { authenticated: true, user },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 },
    )
  }
}
