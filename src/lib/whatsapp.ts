// Transforma qualquer formato de número em link do WhatsApp
export function buildWhatsAppLink(phone: string | null | undefined): string | null {
  if (!phone) return null

  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '')

  // Se já tem 55 na frente (ex: 5534991549095), usa direto
  // Se tem 11 dígitos (ex: 34991549095), adiciona 55
  // Se tem 10 dígitos (fixo), adiciona 55
  const withCountry = cleaned.startsWith('55') && cleaned.length >= 12
    ? cleaned
    : `55${cleaned}`

  return `https://wa.me/${withCountry}`
}

// Pega o melhor número disponível do cliente (prioridade: whatsapp > celular > telefone)
export function getBestPhone(client: {
  whatsapp?: string | null
  celular?: string | null
  telefone?: string | null
}): string | null {
  return client.whatsapp || client.celular || client.telefone || null
}