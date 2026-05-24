'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersService } from '@/services/orders';
import { Order } from '@/types';
import { formatAmount } from '@/utils/calculations';
import Notification from './Notification';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditOrderModal from './EditOrderModal';
import styles from './page.module.css';

export default function HistorialPedidos() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const allOrders = await ordersService.getAll();
      setOrders(allOrders);
      
      console.log('Total de pedidos cargados:', allOrders.length);
      
      // Determine which date to show by default
      const now = new Date();
      const currentHour = now.getHours();

      // If it's early morning (before 6 AM), default to yesterday so the
      // previous night's shift stays visible.
      let defaultDate;
      if (currentHour < 6) {
        // Show yesterday's orders
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        defaultDate = yesterday;
      } else {
        // Show today's orders
        defaultDate = now;
      }
      
      const defaultDateString = defaultDate.getFullYear() + '-' + 
        String(defaultDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(defaultDate.getDate()).padStart(2, '0');
      
      setSelectedDate(defaultDateString);
      console.log('Fecha por defecto seleccionada:', defaultDateString);
      
      // Apply filter for the default date
      const filtered = allOrders.filter((order: Order) => {
        const orderDate = new Date(order.fecha);
        const orderDateString = orderDate.getFullYear() + '-' +
          String(orderDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(orderDate.getDate()).padStart(2, '0');

        return orderDateString === defaultDateString;
      });
      
      console.log('Pedidos de la fecha por defecto:', filtered.length);
      setFilteredOrders(filtered);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleDateFilter = async (date: string) => {
    setSelectedDate(date);
    if (!date) {
      setFilteredOrders(orders);
    } else {
      try {
        const startDate = new Date(date + 'T00:00:00');
        const endDate = new Date(date + 'T23:59:59.999');

        const filtered = orders.filter(order => {
          const orderDate = new Date(order.fecha);
          return orderDate >= startDate && orderDate <= endDate;
        });

        setFilteredOrders(filtered);
      } catch (error) {
        console.error('Error al filtrar por fecha:', error);
        alert('Error al filtrar los pedidos');
      }
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'uber': return 'Uber';
      case 'pedidosya': return 'PedidosYa';
      case 'whatsapp': return 'WhatsApp';
      default: return platform;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'transferencia': return 'Transferencia';
      case 'tarjeta': return 'Tarjeta';
      default: return method;
    }
  };

  const getDeliveryPersonName = (person: string) => {
    switch (person) {
      case 'rosi': return 'Rosi';
      case 'josue': return 'Josue';
      case 'none': return 'Sin entrega';
      default: return person;
    }
  };

  const getCardTypeName = (tipo: string) => {
    switch (tipo) {
      case 'debito': return 'Débito';
      case 'credito': return 'Crédito';
      default: return tipo;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = (orders: Order[]) => {
    return orders.reduce((total, order) => total + (order.monto_neto || 0), 0);
  };

  const getPlatformStatistics = (orders: Order[]) => {
    const stats = {
      uber: { count: 0, total: 0 },
      pedidosya: { count: 0, total: 0, efectivo: 0, efectivoTotal: 0 },
      whatsapp: { count: 0, total: 0 }
    };

    orders.forEach(order => {
      const orderAmount = order.monto_neto || 0;

      switch (order.plataforma) {
        case 'uber':
          stats.uber.count++;
          stats.uber.total += orderAmount;
          break;
        case 'pedidosya':
          if (order.pagado_efectivo === true) {
            // Count ONLY in efectivo
            stats.pedidosya.efectivo++;
            stats.pedidosya.efectivoTotal += orderAmount;
          } else {
            // Count ONLY in regular PedidosYa
            stats.pedidosya.count++;
            stats.pedidosya.total += orderAmount;
          }
          break;
        case 'whatsapp':
          stats.whatsapp.count++;
          stats.whatsapp.total += orderAmount;
          break;
      }
    });

    return stats;
  };

  const handleDeleteClick = (order: Order) => {
    setDeletingOrderId(order.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrderId) return;

    setActionLoading(deletingOrderId);
    try {
      await ordersService.delete(deletingOrderId);

      // Update local state
      setOrders(prev => prev.filter(o => o.id !== deletingOrderId));
      setFilteredOrders(prev => prev.filter(o => o.id !== deletingOrderId));

      setNotification({ type: 'success', message: 'Pedido eliminado exitosamente' });
      setDeletingOrderId(null);
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      setNotification({ type: 'error', message: 'Error al eliminar el pedido. Inténtalo de nuevo.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
  };

  const handleEditSave = async (updatedData: Partial<Order>) => {
    if (!editingOrder) return;

    setActionLoading(editingOrder.id);
    try {
      const updated = await ordersService.update(editingOrder.id, updatedData);

      // Update local state
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      setFilteredOrders(prev => prev.map(o => o.id === updated.id ? updated : o));

      setNotification({ type: 'success', message: 'Pedido actualizado exitosamente' });
      setEditingOrder(null);
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el pedido. Inténtalo de nuevo.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalCancel = () => {
    if (!actionLoading) {
      setDeletingOrderId(null);
      setEditingOrder(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Volver
          </button>
          <h1 className={styles.title}>Historial de Pedidos</h1>
        </div>
        <div className={styles.content}>
          <p>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1 className={styles.title}>Historial de Pedidos</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.filters}>
          <div className={styles.dateFilter}>
            <label htmlFor="dateFilter">Filtrar por fecha:</label>
            <input
              type="date"
              id="dateFilter"
              value={selectedDate}
              onChange={(e) => handleDateFilter(e.target.value)}
              className={styles.dateInput}
            />
            {selectedDate && (
              <button
                onClick={() => handleDateFilter('')}
                className={styles.clearFilter}
              >
                Limpiar filtro
              </button>
            )}
          </div>

          <div className={styles.summarySection}>
            <div className={styles.totalSummary}>
              <p><strong>Total de pedidos:</strong> {filteredOrders.length}</p>
              <p><strong>Total monto día:</strong> ${formatAmount(calculateTotal(filteredOrders))}</p>
            </div>

            <div className={styles.platformStats}>
              {(() => {
                const stats = getPlatformStatistics(filteredOrders);
                return (
                  <>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>🚗</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Uber</div>
                        <div className={styles.statValue}>{stats.uber.count}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.uber.total)}</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>🍕</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>PedidosYa</div>
                        <div className={styles.statValue}>{stats.pedidosya.count}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.pedidosya.total)}</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>💵</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>PedidosYa Efectivo</div>
                        <div className={styles.statValue}>{stats.pedidosya.efectivo}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.pedidosya.efectivoTotal)}</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>📱</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>WhatsApp</div>
                        <div className={styles.statValue}>{stats.whatsapp.count}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.whatsapp.total)}</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className={styles.ordersContainer}>
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay pedidos para mostrar</p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {filteredOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.platformBadge}>
                      {getPlatformName(order.plataforma)}
                    </div>
                    <div className={styles.orderDate}>
                      {formatDate(order.fecha)}
                    </div>
                  </div>
                  
                  <div className={styles.orderDetails}>
                    <div className={styles.orderInfo}>
                      <p><strong>Monto:</strong> ${formatAmount(order.monto)}</p>
                      {order.comision && order.comision > 0 && (
                        <p><strong>Comisión ({
                          order.plataforma === 'whatsapp' && order.metodo_pago === 'tarjeta' && order.tipo_tarjeta === 'credito' ? '4%' :
                          order.plataforma === 'whatsapp' && order.metodo_pago === 'tarjeta' ? '2%' :
                          order.plataforma === 'whatsapp' ? '0%' :
                          '36%'
                        }):</strong> ${formatAmount(order.comision)}</p>
                      )}
                      {(order.plataforma === 'uber' || order.plataforma === 'pedidosya' || (order.plataforma === 'whatsapp' && order.metodo_pago === 'tarjeta') || order.persona_entrega === 'josue') && (
                        <p><strong>Monto neto:</strong> ${formatAmount(order.monto_neto || 0)}</p>
                      )}
                      {order.referencia && (
                        <p><strong>Referencia:</strong> {order.referencia}</p>
                      )}
                      {order.metodo_pago && order.plataforma === 'whatsapp' && (
                        <p><strong>Método de Pago:</strong> {getPaymentMethodName(order.metodo_pago)}
                          {order.metodo_pago === 'tarjeta' && order.tipo_tarjeta &&
                            ` (${getCardTypeName(order.tipo_tarjeta)})`
                          }
                        </p>
                      )}
                      {order.persona_entrega && order.plataforma === 'whatsapp' && (
                        <p><strong>Entrega:</strong> {getDeliveryPersonName(order.persona_entrega)}</p>
                      )}
                      {order.persona_entrega === 'josue' && order.plataforma === 'whatsapp' && (
                        <p><strong>Costo Entrega:</strong> -$2,000.00</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.orderActions}>
                    <button
                      onClick={() => handleEditClick(order)}
                      className={styles.editButton}
                      disabled={actionLoading === order.id}
                    >
                      {actionLoading === order.id ? 'Cargando...' : 'Editar'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(order)}
                      className={styles.deleteButton}
                      disabled={actionLoading === order.id}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <DeleteConfirmModal
        order={orders.find(o => o.id === deletingOrderId) || null}
        isOpen={!!deletingOrderId}
        onConfirm={handleDeleteConfirm}
        onCancel={handleModalCancel}
        isLoading={!!actionLoading}
      />

      <EditOrderModal
        order={editingOrder}
        isOpen={!!editingOrder}
        onSave={handleEditSave}
        onCancel={handleModalCancel}
        isLoading={!!actionLoading}
      />
    </div>
  );
} 