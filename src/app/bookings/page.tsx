import BookingTokenManager from "./_components/booking-token-manager"
import Header from "../_components/header"
import { db } from "../_lib/prisma"

interface BookingsPageProps {
  searchParams?: {
    token?: string
  }
}

const BookingsPage = async ({ searchParams }: BookingsPageProps) => {
  const token = searchParams?.token ?? ""
  const barbers = await db.barber.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  })

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <BookingTokenManager initialToken={token} barbers={barbers} />
      </main>
    </>
  )
}

export default BookingsPage
