import bcrypt from "bcrypt"
import { NextResponse } from "next/server"
import { z } from "zod"
import { nameSchema, passwordSchema, phoneSchema } from "@/app/_lib/input-validation"
import { db } from "@/app/_lib/prisma"

interface RegisterBody {
  name?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

const registerBodySchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "password and confirmPassword must match",
    path: ["confirmPassword"],
  })

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody
    const parsed = registerBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid register payload" }, { status: 400 })
    }

    const { name, phone, password } = parsed.data

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
