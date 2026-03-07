import Header from "../_components/header"
import CustomerIdentificationForm from "./_components/customer-identification-form"

interface AgendarPageProps {
  searchParams?: {
    next?: string
  }
}

const AgendarPage = ({ searchParams }: AgendarPageProps) => {
  const nextPath = searchParams?.next ?? "/barbers"

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <CustomerIdentificationForm nextPath={nextPath} />
      </main>
    </>
  )
}

export default AgendarPage
