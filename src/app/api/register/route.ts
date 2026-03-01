import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import { db } from "@/app/_lib/prisma"

interface RegisterBody {
  name?: string
  email?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email and password are required" },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "password must have at least 6 characters" },
        { status: 400 },
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "email is already in use" },
        { status: 400 },
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
      },
    })

    return NextResponse.json(
      { message: "user registered successfully" },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "invalid json body" }, { status: 400 })
    }

    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
