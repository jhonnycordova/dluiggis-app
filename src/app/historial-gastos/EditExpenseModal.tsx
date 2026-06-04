'use client'

import { useEffect, useState } from 'react'
import { Expense } from '@/types'
import styles from './EditExpenseModal.module.css'

interface EditExpenseModalProps {
  expense: Expense | null
  isOpen: boolean
  onSave: (updatedData: Partial<Expense>) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export default function EditExpenseModal({
  expense,
  isOpen,
  onSave,
  onCancel,
  isLoading
}: EditExpenseModalProps) {
  const [formData, setFormData] = useState({
    fecha: '',
    tipo: 'salario' as 'salario' | 'insumos' | 'otros' | 'gastos_personales',
    concepto: '',
    monto: ''
  })

  useEffect(() => {
    if (expense) {
      const d = new Date(expense.fecha)
      const pad = (n: number) => String(n).padStart(2, '0')
      const localDateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

      setFormData({
        fecha: localDateTime,
        tipo: expense.tipo,
        concepto: expense.concepto,
        monto: expense.monto.toString()
      })
    }
  }, [expense])

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    const updatedData: Partial<Expense> = {
      fecha: new Date(formData.fecha).toISOString(),
      tipo: formData.tipo,
      concepto: formData.concepto,
      monto: parseFloat(formData.monto)
    }

    await onSave(updatedData)
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Editar Gasto</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="fecha">Fecha y hora:</label>
            <input
              type="datetime-local"
              id="fecha"
              value={formData.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tipo">Tipo de Gasto:</label>
            <select
              id="tipo"
              value={formData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
              className={styles.select}
              required
            >
              <option value="salario">Salario</option>
              <option value="insumos">Insumos</option>
              <option value="gastos_personales">Gastos Personales</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="concepto">Concepto:</label>
            <input
              type="text"
              id="concepto"
              value={formData.concepto}
              onChange={(e) => handleInputChange('concepto', e.target.value)}
              required
              className={styles.input}
              placeholder="Descripción del gasto"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="monto">Monto:</label>
            <input
              type="number"
              id="monto"
              step="0.01"
              value={formData.monto}
              onChange={(e) => handleInputChange('monto', e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
