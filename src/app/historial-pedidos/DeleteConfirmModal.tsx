'use client'

import { useEffect } from 'react'
import { Order } from '@/types'
import styles from './DeleteConfirmModal.module.css'

interface DeleteConfirmModalProps {
  order: Order | null
  isOpen: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export default function DeleteConfirmModal({
  order,
  isOpen,
  onConfirm,
  onCancel,
  isLoading
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen || !order) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel()
    }
  }

  const getPlatformName = (platform: string) => {
    const names: { [key: string]: string } = {
      uber: 'Uber',
      pedidosya: 'PedidosYa',
      whatsapp: 'WhatsApp'
    }
    return names[platform] || platform
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'efectivo': return 'Efectivo'
      case 'transferencia': return 'Transferencia'
      case 'tarjeta': return 'Tarjeta'
      default: return method
    }
  }

  const getCardTypeName = (tipo: string) => {
    switch (tipo) {
      case 'debito': return 'Débito'
      case 'credito': return 'Crédito'
      default: return tipo
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Confirmar Eliminación</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.warningText}>
            ¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.
          </p>

          <div className={styles.orderSummary}>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Plataforma:</span>
              <span className={styles.value}>{getPlatformName(order.plataforma)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Fecha:</span>
              <span className={styles.value}>{formatDate(order.fecha)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Monto:</span>
              <span className={styles.value}>{formatCurrency(order.monto)}</span>
            </div>
            {order.referencia && (
              <div className={styles.summaryRow}>
                <span className={styles.label}>Referencia:</span>
                <span className={styles.value}>{order.referencia}</span>
              </div>
            )}
            {order.metodo_pago && order.plataforma === 'whatsapp' && (
              <div className={styles.summaryRow}>
                <span className={styles.label}>Método de Pago:</span>
                <span className={styles.value}>
                  {getPaymentMethodName(order.metodo_pago)}
                  {order.metodo_pago === 'tarjeta' && order.tipo_tarjeta &&
                    ` (${getCardTypeName(order.tipo_tarjeta)})`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={styles.deleteButton}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
