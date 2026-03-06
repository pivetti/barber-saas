import { redirect } from "next/navigation"
import { getAdminFromToken } from "./admin-auth"

export const requireAdmin = async () => {
  const admin = await getAdminFromToken()

  if (!admin) {
    redirect("/admin/login")
  }

  return admin
}
