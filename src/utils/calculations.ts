import { Order } from '@/types'

// Un pedido Transbank es un pedido de WhatsApp pagado con tarjeta (la maquinita)
export const isTransbankOrder = (order: Order): boolean =>
  order.plataforma === 'whatsapp' && order.metodo_pago === 'tarjeta'

// Lo que Transbank deposita: monto − comisión (NO usa monto_neto, que resta el
// costo de entrega de Josué)
export const getTransbankNet = (order: Order): number =>
  order.monto - (order.comision || 0)

export const calculateCommission = (
  platform: string,
  amount: number,
  paymentMethod?: string,
  cardType?: 'debito' | 'credito'
): number => {
  if (platform === 'uber' || platform === 'pedidosya') {
    return amount * 0.36 // 36%
  } else if (platform === 'whatsapp' && paymentMethod === 'tarjeta') {
    if (cardType === 'credito') {
      return amount * 0.04 // 4%
    } else {
      return amount * 0.02 // 2% (débito o sin especificar)
    }
  }
  return 0
}

export const calculateNetAmount = (
  amount: number,
  commission: number,
  deliveryPerson?: string
): number => {
  let netAmount = amount - commission;

  // Restar costo de entrega para Josue (2000 pesos)
  if (deliveryPerson === 'josue') {
    netAmount -= 2000;
  }

  return netAmount;
}

export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
