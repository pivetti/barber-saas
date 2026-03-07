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
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header />
      <main className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800/60 bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.12),transparent_45%),linear-gradient(to_bottom,rgba(24,24,27,0.95),rgba(9,9,11,0.92))] p-6 shadow-[0_20px_42px_rgba(0,0,0,0.32)]">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/75">Painel Admin</p>
            <h1 className="text-2xl font-semibold text-zinc-50">Login Admin</h1>
            <p className="text-sm text-zinc-400/95">Entre com seu email e senha.</p>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-800/70 bg-zinc-950/45 p-4">
            <AdminLoginForm nextPath={nextPath} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminLoginPage
