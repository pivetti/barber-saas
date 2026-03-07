"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../_components/ui/button"
import { Input } from "../_components/ui/input"
import Header from "../_components/header"

interface ApiErrorResponse {
  error?: string
}

const RegisterPage = () => {
  const router = useRouter()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const formError = useMemo(() => {
    if (password && password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres."
    }

    if (confirmPassword && password !== confirmPassword) {
      return "As senhas não coincidem."
    }

    return null
  }, [password, confirmPassword])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (formError) {
      setErrorMessage(formError)
      return
    }

    setIsSubmitting(true)
    try {
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          password,
          confirmPassword,
        }),
      })

      const registerData = (await registerResponse.json()) as ApiErrorResponse
      if (!registerResponse.ok) {
        setErrorMessage(registerData.error ?? "Não foi possível criar a conta.")
        return
      }

      router.push("/login?registered=1")
    } catch (error) {
      setErrorMessage("Erro interno ao criar conta.")
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
            <h1 className="text-2xl font-bold">Criar conta</h1>
            <p className="text-sm text-gray-400">
              Cadastre-se para fazer agendamentos online.
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
              type="tel"
              placeholder="Seu telefone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            {(errorMessage || formError) && (
              <p className="text-sm text-red-500">{errorMessage ?? formError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || Boolean(formError)}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Ja tem conta?{" "}
            <Link href="/login" className="font-semibold text-primary underline">
              Fazer login
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

export default RegisterPage
