import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import {
  ADMIN_AUTH_COOKIE_NAME,
  adminAuthCookieOptions,
  signAdminAuthToken,
} from "@/app/_lib/admin-auth"
import { db } from "@/app/_lib/prisma"

interface AdminLoginBody {
  identifier?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminLoginBody
    const identifier = body.identifier?.trim().toLowerCase()
    const password = body.password

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "email/phone and password are required" },
        { status: 400 },
      )
    }

    const barber = await db.barber.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
      },
    })

    if (!barber?.password) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, barber.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 })
    }

    const token = signAdminAuthToken({
      sub: barber.id,
      name: barber.name,
      phone: barber.phone,
      email: barber.email,
    })

    const response = NextResponse.json(
      {
        message: "login successful",
        barber: {
          id: barber.id,
          name: barber.name,
          phone: barber.phone,
          email: barber.email,
        },
      },
      { status: 200 },
    )

    response.cookies.set(ADMIN_AUTH_COOKIE_NAME, token, adminAuthCookieOptions)

    return response
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "invalid json body" }, { status: 400 })
    }

    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
