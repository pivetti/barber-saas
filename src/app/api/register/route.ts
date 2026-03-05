import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import { db } from "@/app/_lib/prisma"

interface RegisterBody {
  name?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody
    const name = body.name?.trim()
    const phone = body.phone?.trim()
    const password = body.password
    const confirmPassword = body.confirmPassword

    if (!name || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "name, phone, password and confirmPassword are required" },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "password must have at least 6 characters" },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "password and confirmPassword must match" },
        { status: 400 },
      )
    }

    const existingByName = await db.user.findUnique({
      where: { name },
      select: { id: true },
    })

    if (existingByName) {
      return NextResponse.json(
        { error: "name is already in use" },
        { status: 400 },
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db.user.create({
      data: {
        name,
        phone,
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
