'use client'

import { useEffect, useState } from 'react'
import { Order } from '@/types'
import { calculateCommission, calculateNetAmount } from '@/utils/calculations'
import styles from './EditOrderModal.module.css'

interface EditOrderModalProps {
  order: Order | null
  isOpen: boolean
  onSave: (updatedData: Partial<Order>) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export default function EditOrderModal({
  order,
  isOpen,
  onSave,
  onCancel,
  isLoading
}: EditOrderModalProps) {
  const [formData, setFormData] = useState({
    fecha: '',
    plataforma: 'uber' as 'uber' | 'pedidosya' | 'whatsapp',
    referencia: '',
    monto: '',
    metodo_pago: 'efectivo',
    persona_entrega: 'none',
    tipo_tarjeta: 'debito',
    pagado_efectivo: false
  })

  useEffect(() => {
    if (order) {
      // Convert ISO date to datetime-local format
      const localDateTime = new Date(order.fecha).toISOString().slice(0, 16)

      setFormData({
        fecha: localDateTime,
        plataforma: order.plataforma,
        referencia: order.referencia || '',
        monto: order.monto.toString(),
        metodo_pago: order.metodo_pago || 'efectivo',
        persona_entrega: order.persona_entrega || 'none',
        tipo_tarjeta: order.tipo_tarjeta || 'debito',
        pagado_efectivo: order.pagado_efectivo || false
      })
    }
  }, [order])

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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      // If changing platform, reset platform-specific fields
      if (field === 'plataforma') {
        return {
          ...prev,
          plataforma: value as 'uber' | 'pedidosya' | 'whatsapp',
          referencia: '',
          metodo_pago: 'efectivo',
          persona_entrega: 'none',
          tipo_tarjeta: 'debito',
          pagado_efectivo: false
        }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    const monto = parseFloat(formData.monto)
    const comision = calculateCommission(formData.plataforma, monto, formData.metodo_pago, formData.tipo_tarjeta as 'debito' | 'credito')
    const monto_neto = calculateNetAmount(
      monto,
      comision,
      formData.plataforma === 'whatsapp' ? formData.persona_entrega : undefined
    )

    const updatedData: Partial<Order> = {
      plataforma: formData.plataforma,
      referencia: formData.referencia || undefined,
      monto: monto,
      metodo_pago: formData.plataforma === 'whatsapp' ? formData.metodo_pago : undefined,
      persona_entrega: formData.plataforma === 'whatsapp' ? formData.persona_entrega : undefined,
      tipo_tarjeta: formData.plataforma === 'whatsapp' && formData.metodo_pago === 'tarjeta'
        ? (formData.tipo_tarjeta as 'debito' | 'credito')
        : undefined,
      pagado_efectivo: formData.plataforma === 'pedidosya' ? formData.pagado_efectivo : undefined
    }

    // Always set commission and net amount
    updatedData.comision = comision > 0 ? comision : undefined
    updatedData.monto_neto = monto_neto

    await onSave(updatedData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calculate preview values
  const previewMonto = parseFloat(formData.monto) || 0
  const previewComision = calculateCommission(formData.plataforma, previewMonto, formData.metodo_pago, formData.tipo_tarjeta as 'debito' | 'credito')
  const previewMontoNeto = calculateNetAmount(previewMonto, previewComision)

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Editar Pedido</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="plataforma">Plataforma:</label>
            <select
              id="plataforma"
              value={formData.plataforma}
              onChange={(e) => handleInputChange('plataforma', e.target.value)}
              className={styles.select}
            >
              <option value="uber">Uber</option>
              <option value="pedidosya">PedidosYa</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          {formData.plataforma === 'uber' && (
            <div className={styles.formGroup}>
              <label htmlFor="referencia">Referencia:</label>
              <input
                type="text"
                id="referencia"
                value={formData.referencia}
                onChange={(e) => handleInputChange('referencia', e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          {formData.plataforma === 'pedidosya' && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="referencia">Referencia:</label>
                <input
                  type="text"
                  id="referencia"
                  value={formData.referencia}
                  onChange={(e) => handleInputChange('referencia', e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.pagado_efectivo}
                    onChange={(e) => handleInputChange('pagado_efectivo', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>Pagado en efectivo</span>
                </label>
              </div>
            </>
          )}

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

          {formData.plataforma === 'whatsapp' && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="metodo_pago">Método de Pago:</label>
                <select
                  id="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={(e) => handleInputChange('metodo_pago', e.target.value)}
                  className={styles.select}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              {formData.metodo_pago === 'tarjeta' && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="tipo_tarjeta">Tipo de Tarjeta:</label>
                    <select
                      id="tipo_tarjeta"
                      value={formData.tipo_tarjeta}
                      onChange={(e) => handleInputChange('tipo_tarjeta', e.target.value)}
                      className={styles.select}
                      required
                    >
                      <option value="debito">Débito (2%)</option>
                      <option value="credito">Crédito (4%)</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="referencia">Referencia:</label>
                    <input
                      type="text"
                      id="referencia"
                      value={formData.referencia}
                      onChange={(e) => handleInputChange('referencia', e.target.value)}
                      required
                      className={styles.input}
                    />
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="persona_entrega">Entrega:</label>
                <select
                  id="persona_entrega"
                  value={formData.persona_entrega}
                  onChange={(e) => handleInputChange('persona_entrega', e.target.value)}
                  className={styles.select}
                >
                  <option value="none">Sin entrega</option>
                  <option value="rosi">Rosi</option>
                  <option value="josue">Josue</option>
                </select>
              </div>
            </>
          )}

          {previewMonto > 0 && (
            <div className={styles.preview}>
              <div className={styles.previewRow}>
                <span>Comisión:</span>
                <span className={styles.previewValue}>
                  {formatCurrency(previewComision)} ({((previewComision / previewMonto) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className={styles.previewRow}>
                <span>Monto Neto:</span>
                <span className={styles.previewValue}>{formatCurrency(previewMontoNeto)}</span>
              </div>
            </div>
          )}

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
