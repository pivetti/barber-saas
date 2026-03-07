import bcrypt from "bcrypt"
import { randomBytes } from "crypto"
import { Prisma, PrismaClient } from "@prisma/client"
import { z } from "zod"

const prisma = new PrismaClient()
const isProduction = process.env.NODE_ENV === "production"

const seedEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  ADMIN_ROLE: z.enum(["OWNER", "ADMIN"]).optional(),
  ADMIN_NAME: z.string().min(1).optional(),
  ADMIN_PHONE: z.string().min(1).optional(),
  ADMIN_IMAGE_URL: z.string().url().optional(),
})

type SeedEnv = z.infer<typeof seedEnvSchema>

const getSeedEnv = (): SeedEnv => {
  const parsed = seedEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
    throw new Error(`Invalid seed environment configuration: ${message}`)
  }

  return parsed.data
}

async function upsertServices() {
  const servicesData = [
    {
      name: "Corte",
      description: "Corte classico e moderno com acabamento profissional.",
      price: new Prisma.Decimal(50.0),
      imageUrl: "/services/cabelo.svg",
    },
    {
      name: "Barba",
      description: "Modelagem completa para um visual alinhado.",
      price: new Prisma.Decimal(35.0),
      imageUrl: "/services/barba.svg",
    },
    {
      name: "Hidratacao",
      description: "Tratamento rapido para fios mais saudaveis.",
      price: new Prisma.Decimal(30.0),
      imageUrl: "/services/hidratacao.svg",
    },
  ]

  for (const service of servicesData) {
    const existing = await prisma.service.findFirst({
      where: { name: service.name },
      select: { id: true },
    })

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: service,
      })
    } else {
      await prisma.service.create({
        data: service,
      })
    }
  }
}

async function createInitialAdminBarber(env: SeedEnv) {
  const adminEmail = env.ADMIN_EMAIL.toLowerCase()
  const adminPassword = env.ADMIN_PASSWORD
  const adminName = env.ADMIN_NAME?.trim() || "Goku"
  const adminPhone = env.ADMIN_PHONE?.trim() || null
  const adminRole = env.ADMIN_ROLE ?? "OWNER"
  const adminImageUrl =
    env.ADMIN_IMAGE_URL?.trim() ||
    "/barbers/goku.jpg"

  const existing = await prisma.barber.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  })

  if (existing) {
    console.log(`Admin barber already exists for ${adminEmail}`)
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  await prisma.barber.create({
    data: {
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: passwordHash,
      imageUrl: adminImageUrl,
      role: adminRole,
    },
  })

  console.log(`Admin barber created for ${adminEmail}`)
}

async function seedDatabase() {
  try {
    const env = getSeedEnv()

    console.log("Starting seed...")

    await upsertServices()
    await createInitialAdminBarber(env)

    if (!isProduction) {
      await prisma.blockedTime.deleteMany({})
      await prisma.workingHour.deleteMany({})
      await prisma.scheduleSettings.deleteMany({})
      await prisma.barberBlockedSlot.deleteMany({})
      await prisma.barberBlockedDay.deleteMany({})
      await prisma.barberAvailability.deleteMany({})
      await prisma.booking.deleteMany({})

      const services = await prisma.service.findMany({
        orderBy: { name: "asc" },
        take: 2,
      })
      const barbers = await prisma.barber.findMany({
        where: {
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
        take: 2,
      })

      for (const barber of barbers) {
        await prisma.scheduleSettings.create({
          data: {
            barberId: barber.id,
            slotIntervalMinutes: 30,
          },
        })

        await prisma.workingHour.createMany({
          data: [
            { barberId: barber.id, dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
            { barberId: barber.id, dayOfWeek: 1, startTime: "13:00", endTime: "18:00" },
            { barberId: barber.id, dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
            { barberId: barber.id, dayOfWeek: 2, startTime: "13:00", endTime: "18:00" },
            { barberId: barber.id, dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
            { barberId: barber.id, dayOfWeek: 3, startTime: "13:00", endTime: "18:00" },
            { barberId: barber.id, dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
            { barberId: barber.id, dayOfWeek: 4, startTime: "13:00", endTime: "18:00" },
            { barberId: barber.id, dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
            { barberId: barber.id, dayOfWeek: 5, startTime: "13:00", endTime: "18:00" },
            { barberId: barber.id, dayOfWeek: 6, startTime: "08:00", endTime: "13:00" },
          ],
        })
      }

      if (services.length >= 2 && barbers.length >= 2) {
        await prisma.booking.createMany({
          data: [
            {
              serviceId: services[0].id,
              barberId: barbers[0].id,
              date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              customerName: "Henrique Pivetti",
              customerPhone: "5511991111111",
              cancellationToken: `ct_${randomBytes(16).toString("hex")}`,
              status: "SCHEDULED",
            },
            {
              serviceId: services[1].id,
              barberId: barbers[1].id,
              date: new Date(Date.now() - 24 * 60 * 60 * 1000),
              customerName: "Joao Silva",
              customerPhone: "5511992222222",
              cancellationToken: `ct_${randomBytes(16).toString("hex")}`,
              status: "DONE",
            },
          ],
        })
      }
    }

    console.log("Seed finished")
  } catch (error) {
    console.error("Seed error:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void seedDatabase()
