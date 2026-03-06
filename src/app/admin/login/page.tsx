import AdminLoginForm from "./admin-login-form"

interface AdminLoginPageProps {
  searchParams?: {
    next?: string
  }
}

const AdminLoginPage = ({ searchParams }: AdminLoginPageProps) => {
  const nextPath = searchParams?.next || "/admin/dashboard"

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5">
      <div className="w-full space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div>
          <h1 className="text-2xl font-bold">Login Admin</h1>
          <p className="text-sm text-zinc-400">
            Entre com email ou telefone e sua senha.
          </p>
        </div>

        <AdminLoginForm nextPath={nextPath} />
      </div>
    </main>
  )
}

export default AdminLoginPage
