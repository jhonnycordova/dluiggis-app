import { Order } from '@/types'

export const calculateCommission = (platform: string, amount: number, paymentMethod?: string): number => {
  if (platform === 'uber' || platform === 'pedidosya') {
    return amount * 0.36 // 36%
  } else if (platform === 'whatsapp' && paymentMethod === 'tarjeta') {
    return amount * 0.02 // 2%
  }
  return 0
}

export const calculateNetAmount = (amount: number, commission: number): number => {
  return amount - commission
}

export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
