"use client"

import {
  CalendarIcon,
  ChevronRightIcon,
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  ScissorsIcon,
  UserPlusIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { cn } from "../_lib/utils"
import { Button } from "./ui/button"
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"

const SidebarSheet = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  const loadAuthState = useCallback(async () => {
    try {
      const response = await fetch("/api/me", {
        method: "GET",
        cache: "no-store",
      })

      if (!response.ok) {
        setIsAuthenticated(false)
        setUserName(null)
        return
      }

      const data = (await response.json()) as {
        authenticated?: boolean
        user?: { name?: string | null } | null
      }
      const authenticated = Boolean(data.authenticated)
      setIsAuthenticated(authenticated)
      setUserName(authenticated ? (data.user?.name ?? null) : null)
    } catch {
      setIsAuthenticated(false)
      setUserName(null)
    }
  }, [])

  useEffect(() => {
    loadAuthState()
  }, [pathname, loadAuthState])

  useEffect(() => {
    const handleAuthChanged = () => {
      loadAuthState()
    }

    window.addEventListener("focus", handleAuthChanged)
    window.addEventListener("auth-changed", handleAuthChanged)

    return () => {
      window.removeEventListener("focus", handleAuthChanged)
      window.removeEventListener("auth-changed", handleAuthChanged)
    }
  }, [loadAuthState])

  const handleLogoutClick = async () => {
    setLogoutLoading(true)
    try {
      await fetch("/api/logout", {
        method: "POST",
      })
      setIsAuthenticated(false)
      setUserName(null)
      window.dispatchEvent(new Event("auth-changed"))
      router.push("/")
      router.refresh()
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <SheetContent
      className={cn("overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-0 text-zinc-100")}
    >
      <SheetHeader className="space-y-0 border-b border-zinc-800 p-5 pr-14">
        <div>
          <SheetTitle className="text-left text-base font-semibold text-zinc-100">
            {userName || "Faca seu login"}
          </SheetTitle>
          <p className="text-left text-xs text-zinc-400">Navegacao rapida</p>
        </div>
      </SheetHeader>

      <div className="space-y-6 p-5">
        <section aria-label="Navegacao principal" className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Navegacao
          </p>

          <SheetClose asChild>
            <Link
              href="/"
              aria-label="Ir para inicio"
              className={cn(
                "group flex h-11 items-center gap-3 rounded-2xl border px-4 text-sm font-medium transition-colors",
                pathname === "/"
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900",
              )}
            >
              <HomeIcon className="h-4 w-4" />
              <span className="flex-1">Inicio</span>
              <ChevronRightIcon className="h-4 w-4 opacity-60 transition group-hover:translate-x-0.5" />
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              href="/services"
              aria-label="Ir para servicos"
              className={cn(
                "group flex h-11 items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                pathname.startsWith("/services")
                  ? "border-violet-500/40 bg-violet-500/20 text-violet-100"
                  : "border-zinc-800 bg-zinc-900/70 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900",
              )}
            >
              <ScissorsIcon className="h-4 w-4" />
              <span className="flex-1">Servicos</span>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              href="/bookings"
              aria-label="Ir para agendamentos"
              className={cn(
                "group flex h-11 items-center gap-3 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                pathname.startsWith("/bookings")
                  ? "border-violet-500/40 bg-violet-500/20 text-violet-100"
                  : "border-violet-500/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20",
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="flex-1">Seus agendamentos</span>
            </Link>
          </SheetClose>
        </section>

        <section aria-label="Area de autenticacao" className="space-y-2 border-t border-zinc-800 pt-4">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Conta
          </p>

          {!isAuthenticated && (
            <div className="space-y-2">
              <SheetClose asChild>
                <Link
                  href="/login"
                  className="flex h-11 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <LogInIcon className="h-4 w-4" />
                  Entrar
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  href="/register"
                  className="flex h-11 items-center gap-3 rounded-2xl border border-violet-500/40 bg-violet-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-400"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  Criar conta
                </Link>
              </SheetClose>
            </div>
          )}

          {isAuthenticated && (
            <Button
              variant="outline"
              className="h-11 w-full justify-start gap-3 rounded-2xl border-violet-500/40 bg-violet-500/10 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-violet-500/20 hover:text-violet-100"
              onClick={handleLogoutClick}
              disabled={logoutLoading}
              aria-label="Logout"
            >
              <LogOutIcon className="h-4 w-4" />
              {logoutLoading ? "Saindo..." : "Logout"}
            </Button>
          )}
        </section>
      </div>
    </SheetContent>
  )
}

export default SidebarSheet
