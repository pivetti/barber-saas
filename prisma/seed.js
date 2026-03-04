const bcrypt = require("bcrypt")
const { PrismaClient, Prisma } = require("@prisma/client")

const prisma = new PrismaClient()
const isProduction = process.env.NODE_ENV === "production"

async function upsertServices() {
  const servicesData = [
    {
      name: "Corte de Cabelo",
      description: "Corte classico e moderno com acabamento profissional.",
      price: new Prisma.Decimal(50.0),
      imageUrl:
        "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
    },
    {
      name: "Barba",
      description: "Modelagem completa para um visual alinhado.",
      price: new Prisma.Decimal(35.0),
      imageUrl:
        "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
    },
    {
      name: "Pezinho",
      description: "Acabamento lateral e nuca para manter o corte em dia.",
      price: new Prisma.Decimal(35.0),
      imageUrl:
        "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
    },
    {
      name: "Sobrancelha",
      description: "Valoriza a expressao e simetria.",
      price: new Prisma.Decimal(20.0),
      imageUrl:
        "https://utfs.io/f/2118f76e-89e4-43e6-87c9-8f157500c333-b0ps0b.png",
    },
    {
      name: "Hidratacao",
      description: "Tratamento rapido para fios mais saudaveis.",
      price: new Prisma.Decimal(30.0),
      imageUrl:
        "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
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

async function upsertBarbers() {
  const barbersData = [
    {
      name: "Jesi",
      imageUrl:
        "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "Rafael",
      imageUrl:
        "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "Lucas",
      imageUrl:
        "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=500&q=80",
    },
  ]

  for (const barber of barbersData) {
    const existing = await prisma.barber.findFirst({
      where: { name: barber.name },
      select: { id: true },
    })

    if (existing) {
      await prisma.barber.update({
        where: { id: existing.id },
        data: barber,
      })
    } else {
      await prisma.barber.create({
        data: barber,
      })
    }
  }
}

async function seedDatabase() {
  try {
    console.log("Starting seed...")

    await upsertServices()
    await upsertBarbers()

    if (!isProduction) {
      // Development only: deterministic demo data reset.
      await prisma.booking.deleteMany({})
      await prisma.user.deleteMany({})

      const demoPassword = process.env.SEED_DEMO_PASSWORD || "dev-only-password"
      const passwordHash = await bcrypt.hash(demoPassword, 12)

      const users = await prisma.$transaction([
        prisma.user.create({
          data: {
            name: "Henrique Pivetti",
            email: "henrique@email.com",
            password: passwordHash,
          },
        }),
        prisma.user.create({
          data: {
            name: "Joao Silva",
            email: "joao@email.com",
            password: passwordHash,
          },
        }),
      ])

      const services = await prisma.service.findMany({
        orderBy: { name: "asc" },
        take: 2,
      })
      const barbers = await prisma.barber.findMany({
        orderBy: { name: "asc" },
        take: 2,
      })

      if (services.length >= 2 && barbers.length >= 2) {
        await prisma.booking.createMany({
          data: [
            {
              userId: users[0].id,
              serviceId: services[0].id,
              barberId: barbers[0].id,
              date: new Date(Date.now() + 24 * 60 * 60 * 1000),
              status: "SCHEDULED",
            },
            {
              userId: users[1].id,
              serviceId: services[1].id,
              barberId: barbers[1].id,
              date: new Date(Date.now() - 24 * 60 * 60 * 1000),
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

seedDatabase()
