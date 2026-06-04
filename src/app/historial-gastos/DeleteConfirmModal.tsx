'use client'

import { useEffect } from 'react'
import { Expense } from '@/types'
import styles from './DeleteConfirmModal.module.css'

interface DeleteConfirmModalProps {
  expense: Expense | null
  isOpen: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export default function DeleteConfirmModal({
  expense,
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

  if (!isOpen || !expense) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel()
    }
  }

  const getTypeName = (tipo: string) => {
    const names: { [key: string]: string } = {
      salario: 'Salario',
      insumos: 'Insumos',
      gastos_personales: 'Gastos Personales',
      otros: 'Otros'
    }
    return names[tipo] || tipo
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

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Confirmar Eliminación</h2>
        </div>

        <div className={styles.content}>
          <p className={styles.warningText}>
            ¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.
          </p>

          <div className={styles.orderSummary}>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Tipo:</span>
              <span className={styles.value}>{getTypeName(expense.tipo)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Fecha:</span>
              <span className={styles.value}>{formatDate(expense.fecha)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Concepto:</span>
              <span className={styles.value}>{expense.concepto}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Monto:</span>
              <span className={styles.value}>{formatCurrency(expense.monto)}</span>
            </div>
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
