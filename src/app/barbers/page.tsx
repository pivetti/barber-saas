import Header from "../_components/header"
import BarbersFlow from "./_components/barbers-flow"
import { db } from "../_lib/prisma"

const BarbersPage = async () => {
  const barbers = await db.barber.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <>
      <Header />
      <BarbersFlow barbers={barbers} />
    </>
  )
}

export default BarbersPage
