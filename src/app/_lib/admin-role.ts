export type AppBarberRole = "OWNER" | "ADMIN" | "BARBER"

export const canManageBarbers = (role: AppBarberRole) => role === "OWNER" || role === "ADMIN"

export const canManageServices = (role: AppBarberRole) => role === "OWNER" || role === "ADMIN"
