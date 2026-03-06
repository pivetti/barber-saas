"use client"

import Link from "next/link"
import { MenuIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import AdminLogoutButton from "./admin-logout-button"
import { cn } from "@/app/_lib/utils"
import { Button } from "@/app/_components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/app/_components/ui/sheet"

interface AdminMobileMenuProps {
  adminName: string
  links: Array<{
    href: string
    label: string
  }>
}

const AdminMobileMenu = ({ adminName, links }: AdminMobileMenuProps) => {
  const pathname = usePathname()

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="md:hidden">
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Abrir menu admin</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[85%] border-zinc-800 bg-zinc-950 p-0">
        <SheetHeader className="border-b border-zinc-800 p-5 text-left">
          <SheetTitle className="text-zinc-100">Painel Admin</SheetTitle>
          <SheetDescription className="text-zinc-400">Barbeiro: {adminName}</SheetDescription>
        </SheetHeader>

        <nav className="space-y-2 p-5">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "block rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  isActiveLink(link.href)
                    ? "border-violet-500/40 bg-violet-500/20 text-violet-100"
                    : "border-zinc-800 bg-zinc-900/70 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900",
                )}
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}

          <div className="pt-2">
            <AdminLogoutButton />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export default AdminMobileMenu
