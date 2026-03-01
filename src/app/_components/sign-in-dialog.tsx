"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { toast } from "sonner"
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

const SignInDialog = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        toast.error(data.error ?? "Nao foi possivel fazer login")
        return
      }

      toast.success("Login realizado com sucesso")
      window.dispatchEvent(new Event("auth-changed"))
      setEmail("")
      setPassword("")
      router.refresh()
    } catch (error) {
      toast.error("Erro interno ao fazer login")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Faça login na plataforma</DialogTitle>
        <DialogDescription>
          Entre com seu e-mail e senha para continuar.
        </DialogDescription>
      </DialogHeader>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <Input
          type="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </>
  )
}

export default SignInDialog
