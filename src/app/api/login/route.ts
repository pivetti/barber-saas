import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"

interface LoginBody {
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 })
    }

    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    })

    const response = NextResponse.json(
      {
        message: "login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 },
    )

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions)

    return response
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "invalid json body" }, { status: 400 })
    }

    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
