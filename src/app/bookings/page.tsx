import BookingTokenManager from "./_components/booking-token-manager"
import Header from "../_components/header"

interface BookingsPageProps {
  searchParams?: {
    token?: string
  }
}

const BookingsPage = ({ searchParams }: BookingsPageProps) => {
  const token = searchParams?.token ?? ""

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <BookingTokenManager initialToken={token} />
      </main>
    </>
  )
}

export default BookingsPage
