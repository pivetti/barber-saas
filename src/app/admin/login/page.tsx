import AdminLoginForm from "./admin-login-form"
import Header from "@/app/_components/header"

interface AdminLoginPageProps {
  searchParams?: {
    next?: string
  }
}

const AdminLoginPage = ({ searchParams }: AdminLoginPageProps) => {
  const nextPath = searchParams?.next || "/admin/dashboard"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-md -translate-y-10 space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div>
            <h1 className="text-2xl font-bold">Login Admin</h1>
            <p className="text-sm text-zinc-400">
              Entre com seu email e senha.
            </p>
          </div>

          <AdminLoginForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  )
}

export default AdminLoginPage
