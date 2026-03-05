const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

const SERVICE_IMAGE_MAP: Record<string, string> = {
  cabelo: "/cabelo.svg",
  "corte de cabelo": "/cabelo.svg",
  barba: "/barba.svg",
  acabamento: "/acabamento.svg",
  pezinho: "/acabamento.svg",
  massagem: "/massagem.svg",
  sobrancelha: "/sobrancelha.svg",
  hidratacao: "/hidratacao.svg",
}

export const getServiceImageUrl = (serviceName: string, fallbackUrl: string) => {
  const normalizedName = normalizeText(serviceName)
  return SERVICE_IMAGE_MAP[normalizedName] ?? fallbackUrl
}
