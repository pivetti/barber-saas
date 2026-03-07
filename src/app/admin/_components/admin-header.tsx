"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import AdminLogoutButton from "./admin-logout-button"
import AdminMobileMenu from "./admin-mobile-menu"
import { AppBarberRole, canManageBarbers, canManageServices } from "@/app/_lib/admin-role"
import { cn } from "@/app/_lib/utils"

interface AdminHeaderProps {
  adminName: string
  adminRole: AppBarberRole
}

const AdminHeader = ({ adminName, adminRole }: AdminHeaderProps) => {
  const pathname = usePathname()
  const links = [
    { href: "/admin/dashboard", label: "Agenda" },
    { href: "/admin/schedule", label: "Horários" },
    ...(canManageServices(adminRole) ? [{ href: "/admin/services", label: "Serviços" }] : []),
    ...(canManageBarbers(adminRole) ? [{ href: "/admin/barbers", label: "Barbeiros" }] : []),
  ]

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-jesi.png"
            alt="Barbearia do Jesi"
            width={64}
            height={40}
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Painel Administrativo</p>
            <p className="text-sm text-zinc-200">Barbeiro: {adminName}</p>
          </div>
        </div>

        <AdminMobileMenu adminName={adminName} links={links} />

        <nav className="hidden flex-wrap items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-xl border px-3 py-2 text-sm transition-colors",
                isActiveLink(link.href)
                  ? "border-violet-500/40 bg-violet-500/20 font-semibold text-violet-100"
                  : "border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900",
              )}
            >
              {link.label}
            </Link>
          ))}
          <AdminLogoutButton />
        </nav>
      </div>
    </header>
  )
}

export default AdminHeader
