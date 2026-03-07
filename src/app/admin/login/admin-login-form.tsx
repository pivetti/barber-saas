"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"

interface ApiErrorResponse {
  error?: string
}

interface AdminLoginFormProps {
  nextPath: string
}

const AdminLoginForm = ({ nextPath }: AdminLoginFormProps) => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = (await response.json()) as ApiErrorResponse

      if (!response.ok) {
        setErrorMessage(data.error ?? "Nao foi possivel fazer login")
        return
      }

      router.push(nextPath)
      router.refresh()
    } catch {
      setErrorMessage("Erro interno ao fazer login")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100"
      />
      <Input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="border-zinc-700/80 bg-zinc-900/85 text-zinc-100"
      />

      {errorMessage && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{errorMessage}</p>
      )}

      <Button
        type="submit"
        className="h-11 w-full rounded-xl border border-violet-500/35 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Entrando..." : "Entrar no painel"}
      </Button>
    </form>
  )
}

export default AdminLoginForm
