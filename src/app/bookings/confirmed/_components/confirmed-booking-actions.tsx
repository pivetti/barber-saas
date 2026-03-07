"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { cancelBookingByToken } from "@/app/_actions/manage-booking-by-token"
import { Button } from "@/app/_components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog"

interface ConfirmedBookingActionsProps {
  token: string
  canCancel: boolean
}

const ConfirmedBookingActions = ({ token, canCancel }: ConfirmedBookingActionsProps) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isCanceled, setIsCanceled] = useState(!canCancel)

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelBookingByToken(token)
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      setIsCanceled(true)
      setOpen(false)
      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" disabled={isPending || isCanceled}>
            Cancelar agendamento agora
          </Button>
        </DialogTrigger>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Confirmar cancelamento</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Você tem certeza que deseja cancelar este agendamento?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Link
        href="/agendar"
        className="inline-flex h-10 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
      >
        Agendar novamente
      </Link>

      <Link
        href="https://wa.me/5500000000000"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10"
      >
        Falar com o barbeiro
      </Link>
    </div>
  )
}

export default ConfirmedBookingActions
