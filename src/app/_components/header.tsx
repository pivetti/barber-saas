"use client"

import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SidebarSheet from "./sidebar-sheet"
import Link from "next/link"

const Header = () => {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="leading-none">
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight text-white">
              JESI
            </span>
            <span className="text-xs uppercase tracking-[0.22em] text-gray-400">
              BARBER
            </span>
          </span>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-lg bg-white/5 text-zinc-100 transition hover:bg-white/10"
              aria-label="Abrir menu"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </div>
    </header>
  )
}

export default Header
