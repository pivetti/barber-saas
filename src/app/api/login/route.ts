import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"

interface LoginBody {
  name?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody
    const name = body.name?.trim()
    const password = body.password

    if (!name || !password) {
      return NextResponse.json(
        { error: "name and password are required" },
        { status: 400 },
      )
    }

    const user = await db.user.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        phone: true,
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
      name: user.name,
      phone: user.phone,
    })

    const response = NextResponse.json(
      {
        message: "login successful",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
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
