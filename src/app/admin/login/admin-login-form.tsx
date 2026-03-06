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
  const [identifier, setIdentifier] = useState("")
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
          identifier,
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
        type="text"
        placeholder="Email ou telefone"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar no painel"}
      </Button>
    </form>
  )
}

export default AdminLoginForm
