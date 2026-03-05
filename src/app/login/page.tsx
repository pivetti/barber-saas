"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "../_components/ui/button"
import { Input } from "../_components/ui/input"
import Header from "../_components/header"

interface ApiErrorResponse {
  error?: string
}

const LoginPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") || "/bookings"

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      })

      const data = (await response.json()) as ApiErrorResponse

      if (!response.ok) {
        setErrorMessage(data.error ?? "Nao foi possivel fazer login.")
        return
      }

      window.dispatchEvent(new Event("auth-changed"))
      router.push(nextPath)
      router.refresh()
    } catch (error) {
      setErrorMessage("Erro interno ao fazer login.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-md items-center px-5">
        <div className="w-full space-y-5 rounded-xl border p-5">
          <div>
            <h1 className="text-2xl font-bold">Entrar</h1>
            <p className="text-sm text-gray-400">
              Acesse sua conta para gerenciar agendamentos.
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Nao tem conta?{" "}
            <Link href="/register" className="font-semibold text-primary underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

export default LoginPage
