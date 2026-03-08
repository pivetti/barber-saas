import Header from "../_components/header"
import BarbersFlow from "./_components/barbers-flow"
import { db } from "../_lib/prisma"
import { getSafePublicImagePath } from "../_lib/safe-public-image"

export const dynamic = "force-dynamic"

const BarbersPage = async () => {
  let barbers: Array<{ id: string; name: string; imageUrl: string }> = []

  try {
    const result = await db.barber.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    })

    barbers = result.map((barber) => ({
      id: barber.id,
      name: barber.name,
      imageUrl: getSafePublicImagePath(barber.imageUrl, "/logo-jesi.png"),
    }))
  } catch (error) {
    console.error("[barbers-page] db.barber.findMany failed", error)
  }

  return (
    <>
      <Header />
      <BarbersFlow barbers={barbers} />
    </>
  )
}

export default BarbersPage
