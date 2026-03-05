import { redirect } from "next/navigation"
import BookingItem from "../_components/booking-item"
import Header from "../_components/header"
import { getConfirmedBookings } from "../_data/get-confirmed-bookings"
import { getConcludedBookings } from "../_data/get-concluded-bookings"
import { getUserFromToken } from "../_lib/auth"

const Bookings = async () => {
  const user = await getUserFromToken()
  if (!user) {
    redirect("/login")
  }

  const confirmedBookings = await getConfirmedBookings()
  const concludedBookings = await getConcludedBookings()

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <h1 className="text-xl font-bold md:text-2xl">Agendamentos</h1>
        </section>

        {confirmedBookings.length === 0 && concludedBookings.length === 0 && (
          <p className="mt-6 text-gray-400">Voce nao tem agendamentos.</p>
        )}

        {confirmedBookings.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
              Confirmados
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {confirmedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                />
              ))}
            </div>
          </section>
        )}

        {concludedBookings.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
              Finalizados
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {concludedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}

export default Bookings
