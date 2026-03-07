import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import {
  ADMIN_AUTH_COOKIE_NAME,
  adminAuthCookieOptions,
  signAdminAuthToken,
} from "@/app/_lib/admin-auth"
import { db } from "@/app/_lib/prisma"

interface AdminLoginBody {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminLoginBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      )
    }

    const barber = await db.barber.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        role: true,
        isActive: true,
      },
    })

    if (!barber?.password || !barber.isActive) {
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
      role: barber.role,
    })

    const response = NextResponse.json(
      {
        message: "login successful",
        barber: {
          id: barber.id,
          name: barber.name,
          phone: barber.phone,
          email: barber.email,
          role: barber.role,
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
