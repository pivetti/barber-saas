import { redirect } from "next/navigation"

interface ManagePageProps {
  searchParams?: {
    token?: string
  }
}

const ManagePage = ({ searchParams }: ManagePageProps) => {
  const token = searchParams?.token?.trim()

  if (token) {
    redirect(`/bookings/session?token=${encodeURIComponent(token)}&next=/bookings`)
  }

  redirect("/bookings")
}

export default ManagePage
