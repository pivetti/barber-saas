const bcrypt = require("bcrypt")
const { PrismaClient, Prisma } = require("@prisma/client")

const prisma = new PrismaClient()

async function seedDatabase() {
  try {
    console.log("Starting seed...")

    // Reset only data, keeping table structure untouched
    await prisma.booking.deleteMany({})
    await prisma.service.deleteMany({})
    await prisma.user.deleteMany({})

    const defaultPasswordHash = await bcrypt.hash("123456", 12)

    const users = await prisma.$transaction([
      prisma.user.create({
        data: {
          name: "Henrique Pivetti",
          email: "henrique@email.com",
          password: defaultPasswordHash,
        },
      }),
      prisma.user.create({
        data: {
          name: "Joao Silva",
          email: "joao@email.com",
          password: defaultPasswordHash,
        },
      }),
      prisma.user.create({
        data: {
          name: "Carlos Souza",
          email: "carlos@email.com",
          password: defaultPasswordHash,
        },
      }),
    ])

    // No premium classification: all services are regular catalog items.
    const services = await prisma.$transaction([
      prisma.service.create({
        data: {
          name: "Corte de Cabelo",
          description: "Corte classico e moderno com acabamento profissional.",
          price: new Prisma.Decimal(50.0),
          imageUrl:
            "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png",
        },
      }),
      prisma.service.create({
        data: {
          name: "Barba",
          description: "Modelagem completa para um visual alinhado.",
          price: new Prisma.Decimal(35.0),
          imageUrl:
            "https://utfs.io/f/e6bdffb6-24a9-455b-aba3-903c2c2b5bde-1jo6tu.png",
        },
      }),
      prisma.service.create({
        data: {
          name: "Pezinho",
          description: "Acabamento lateral e nuca para manter o corte em dia.",
          price: new Prisma.Decimal(35.0),
          imageUrl:
            "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
        },
      }),
      prisma.service.create({
        data: {
          name: "Sobrancelha",
          description: "Valoriza a expressão e simetria.",
          price: new Prisma.Decimal(5.0),
          imageUrl:
            "https://utfs.io/f/2118f76e-89e4-43e6-87c9-8f157500c333-b0ps0b.png",
        },
      }),
      prisma.service.create({
        data: {
          name: "Hidratacao",
          description: "Tratamento rapido para fios mais saudaveis.",
          price: new Prisma.Decimal(30.0),
          imageUrl:
            "https://utfs.io/f/8a457cda-f768-411d-a737-cdb23ca6b9b5-b3pegf.png",
        },
      }),
    ])

    await prisma.booking.createMany({
      data: [
        {
          userId: users[0].id,
          serviceId: services[0].id,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "SCHEDULED",
        },
        {
          userId: users[1].id,
          serviceId: services[1].id,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: "DONE",
        },
      ],
    })

    console.log("Seed finished")
  } catch (error) {
    console.error("Seed error:", error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
