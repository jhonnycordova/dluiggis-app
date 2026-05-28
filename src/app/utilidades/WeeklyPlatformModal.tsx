'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Order, WeeklyComment } from '@/types'
import { formatAmount, isTransbankOrder, getTransbankNet } from '@/utils/calculations'
import { weeklyCommentsService } from '@/services/weeklyComments'
import styles from './WeeklyPlatformModal.module.css'

type Platform = 'uber' | 'pedidosya' | 'whatsapp' | 'transbank'

interface WeeklyPlatformModalProps {
  platform: Platform | null
  year: number
  month: number
  allOrders: Order[]
  isOpen: boolean
  onClose: () => void
}

interface WeekRange {
  start: Date
  end: Date
}

interface WeekRow {
  label: string
  weekStartISO: string
  orders: number
  revenue: number
  commissions: number
  netRevenue: number
}

const PLATFORM_LABELS: Record<Platform, string> = {
  uber: '🚗 Uber',
  pedidosya: '🍕 PedidosYa',
  whatsapp: '📱 WhatsApp',
  transbank: '💳 Transbank'
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function getWeeksOverlappingMonth(year: number, month: number): WeekRange[] {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  const start = new Date(firstOfMonth)
  const dayOfWeek = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)

  const weeks: WeekRange[] = []
  const cursor = new Date(start)
  while (cursor <= lastOfMonth) {
    const weekStart = new Date(cursor)
    const weekEnd = new Date(cursor)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    weeks.push({ start: weekStart, end: weekEnd })
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

function formatWeekLabel(range: WeekRange): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return `${fmt(range.start)} – ${fmt(range.end)}`
}

function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function WeeklyPlatformModal({
  platform,
  year,
  month,
  allOrders,
  isOpen,
  onClose
}: WeeklyPlatformModalProps) {
  const [comments, setComments] = useState<Record<string, WeeklyComment>>({})
  const [editingWeek, setEditingWeek] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [savingWeek, setSavingWeek] = useState<string | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
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
  }, [isOpen, onClose])

  const weeks = useMemo<WeekRow[]>(() => {
    if (!platform) return []
    const ranges = getWeeksOverlappingMonth(year, month)
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0)
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
    return ranges.map(range => {
      const row: WeekRow = {
        label: formatWeekLabel(range),
        weekStartISO: toLocalISODate(range.start),
        orders: 0,
        revenue: 0,
        commissions: 0,
        netRevenue: 0
      }
      allOrders.forEach(order => {
        const matchesPlatform = platform === 'transbank'
          ? isTransbankOrder(order)
          : order.plataforma === platform
        if (!matchesPlatform) return
        const orderDate = new Date(order.fecha)
        const inWeek = orderDate >= range.start && orderDate <= range.end
        const inMonth = orderDate >= monthStart && orderDate <= monthEnd
        if (inWeek && inMonth) {
          row.orders++
          row.revenue += order.monto
          row.commissions += order.comision || 0
          // Para Transbank el neto es monto − comisión (no monto_neto)
          row.netRevenue += platform === 'transbank'
            ? getTransbankNet(order)
            : order.monto_neto || 0
        }
      })
      return row
    })
  }, [platform, year, month, allOrders])

  const totals = useMemo(() => {
    return weeks.reduce(
      (acc, w) => ({
        orders: acc.orders + w.orders,
        revenue: acc.revenue + w.revenue,
        commissions: acc.commissions + w.commissions,
        netRevenue: acc.netRevenue + w.netRevenue
      }),
      { orders: 0, revenue: 0, commissions: 0, netRevenue: 0 }
    )
  }, [weeks])

  useEffect(() => {
    setComments({})
    setEditingWeek(null)
    setDraft('')
  }, [platform, year, month])

  useEffect(() => {
    if (!isOpen || !platform || weeks.length === 0) return
    let cancelled = false
    const firstWeekStart = weeks[0].weekStartISO
    const lastWeekStart = weeks[weeks.length - 1].weekStartISO
    weeklyCommentsService
      .getByRange(platform, firstWeekStart, lastWeekStart)
      .then(rows => {
        if (cancelled) return
        const next: Record<string, WeeklyComment> = {}
        rows.forEach(r => {
          next[r.semana_inicio] = r
        })
        setComments(next)
      })
      .catch(err => {
        console.error('Error al cargar comentarios semanales:', err)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, platform, weeks])

  const startEdit = useCallback(
    (weekStartISO: string) => {
      setEditingWeek(weekStartISO)
      setDraft(comments[weekStartISO]?.comentario ?? '')
    },
    [comments]
  )

  const cancelEdit = useCallback(() => {
    setEditingWeek(null)
    setDraft('')
  }, [])

  const saveComment = useCallback(
    async (weekStartISO: string) => {
      if (!platform) return
      const trimmed = draft.trim()
      const existing = comments[weekStartISO]
      setSavingWeek(weekStartISO)
      try {
        if (trimmed === '') {
          if (existing) {
            await weeklyCommentsService.delete(platform, weekStartISO)
            setComments(prev => {
              const next = { ...prev }
              delete next[weekStartISO]
              return next
            })
          }
        } else {
          const saved = await weeklyCommentsService.upsert(
            platform,
            weekStartISO,
            trimmed
          )
          setComments(prev => ({ ...prev, [weekStartISO]: saved }))
        }
        setEditingWeek(null)
        setDraft('')
      } catch (err) {
        console.error('Error al guardar comentario:', err)
        alert('No se pudo guardar el comentario')
      } finally {
        setSavingWeek(null)
      }
    },
    [platform, draft, comments]
  )

  if (!isOpen || !platform) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>
            {PLATFORM_LABELS[platform]} — {MONTH_NAMES[month]} {year}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Semana</th>
                  <th className={styles.numCol}>Pedidos</th>
                  <th className={styles.numCol}>Ingresos</th>
                  <th className={styles.numCol}>Comisiones</th>
                  <th className={styles.numCol}>Neto</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map(week => {
                  const comment = comments[week.weekStartISO]
                  const isEditing = editingWeek === week.weekStartISO
                  const isSaving = savingWeek === week.weekStartISO
                  return (
                    <tr key={week.weekStartISO} className={styles.weekRow}>
                      <td className={styles.weekLabelCell} data-label="Semana">{week.label}</td>
                      <td className={styles.numCol} data-label="Pedidos">{week.orders}</td>
                      <td className={styles.numCol} data-label="Ingresos">${formatAmount(week.revenue)}</td>
                      <td className={styles.numCol} data-label="Comisiones">${formatAmount(week.commissions)}</td>
                      <td className={styles.numCol} data-label="Neto">${formatAmount(week.netRevenue)}</td>
                      <td className={styles.commentCell} data-label="Comentario">
                        {isEditing ? (
                          <div className={styles.commentEditor}>
                            <textarea
                              className={styles.commentTextarea}
                              value={draft}
                              onChange={e => setDraft(e.target.value)}
                              placeholder="Escribe una nota para esta semana…"
                              rows={3}
                              autoFocus
                              disabled={isSaving}
                            />
                            <div className={styles.commentActions}>
                              <button
                                type="button"
                                className={styles.cancelButton}
                                onClick={cancelEdit}
                                disabled={isSaving}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                className={styles.saveButton}
                                onClick={() => saveComment(week.weekStartISO)}
                                disabled={isSaving}
                              >
                                {isSaving ? 'Guardando…' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.commentDisplay}>
                            {comment ? (
                              <span className={styles.commentText} title={comment.comentario}>
                                {comment.comentario}
                              </span>
                            ) : (
                              <span className={styles.emptyComment}>— sin nota —</span>
                            )}
                            <button
                              type="button"
                              className={styles.editButton}
                              onClick={() => startEdit(week.weekStartISO)}
                              aria-label={comment ? 'Editar comentario' : 'Agregar comentario'}
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className={`${styles.weekRow} ${styles.totalsRow}`}>
                  <td className={styles.weekLabelCell} data-label="Semana">Total</td>
                  <td className={styles.numCol} data-label="Pedidos">{totals.orders}</td>
                  <td className={styles.numCol} data-label="Ingresos">${formatAmount(totals.revenue)}</td>
                  <td className={styles.numCol} data-label="Comisiones">${formatAmount(totals.commissions)}</td>
                  <td className={styles.numCol} data-label="Neto">${formatAmount(totals.netRevenue)}</td>
                  <td className={styles.commentCell} aria-hidden="true"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className={styles.note}>
            Cada semana muestra el rango completo Lun–Dom, pero solo se cuentan
            los pedidos del mes seleccionado.
          </p>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.closeFooterButton}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
