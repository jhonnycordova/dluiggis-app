'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersService } from '@/services/orders';
import { Order } from '@/types';
import { formatAmount } from '@/utils/calculations';
import styles from './page.module.css';

export default function HistorialPedidos() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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
      
      // If it's early morning (before 6 AM), show yesterday's orders
      // This handles the case where late night orders appear as next day in UTC
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
        // Convert UTC date to local date for comparison
        const localOrderDate = new Date(orderDate.getTime() - (orderDate.getTimezoneOffset() * 60000));
        const orderDateString = localOrderDate.getFullYear() + '-' + 
          String(localOrderDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(localOrderDate.getDate()).padStart(2, '0');
        
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
        // For date filtering, we need to consider the full day in local timezone
        const startDate = new Date(date + 'T00:00:00');
        const endDate = new Date(date + 'T23:59:59');
        
        // Convert local dates to UTC for comparison with Supabase dates
        const utcStartDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
        const utcEndDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000));
        
        console.log(`Filtrando por fecha: ${date}`);
        console.log(`Rango local: ${startDate.toISOString()} - ${endDate.toISOString()}`);
        console.log(`Rango UTC: ${utcStartDate.toISOString()} - ${utcEndDate.toISOString()}`);
        
        // Filter orders that fall within the local date range
        const filtered = orders.filter(order => {
          const orderDate = new Date(order.fecha);
          const isInRange = orderDate >= utcStartDate && orderDate <= utcEndDate;
          
          if (isInRange) {
            console.log(`Pedido ${order.id} incluido: ${order.fecha}`);
          }
          
          return isInRange;
        });
        
        console.log(`Pedidos encontrados para ${date}: ${filtered.length}`);
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
    return orders.reduce((total, order) => {
      const orderAmount = order.monto - (order.comision || 0);
      return total + orderAmount;
    }, 0);
  };

  const calculateTotalCommission = (orders: Order[]) => {
    return orders.reduce((total, order) => total + (order.comision || 0), 0);
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
          
          <div className={styles.summary}>
            <p>Total de pedidos: {filteredOrders.length}</p>
            <p>Total monto día: ${formatAmount(calculateTotal(filteredOrders))}</p>
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
                        <p><strong>Comisión ({order.plataforma === 'whatsapp' ? '2%' : '36%'}):</strong> ${formatAmount(order.comision)}</p>
                      )}
                      {order.monto_neto && (order.plataforma === 'uber' || order.plataforma === 'pedidosya' || (order.plataforma === 'whatsapp' && order.metodo_pago === 'tarjeta')) && (
                        <p><strong>Monto total:</strong> ${formatAmount(order.monto_neto)}</p>
                      )}
                      {order.referencia && (
                        <p><strong>Referencia:</strong> {order.referencia}</p>
                      )}
                      {order.metodo_pago && order.plataforma === 'whatsapp' && (
                        <p><strong>Método de Pago:</strong> {getPaymentMethodName(order.metodo_pago)}</p>
                      )}
                      {order.persona_entrega && order.plataforma === 'whatsapp' && (
                        <p><strong>Entrega:</strong> {getDeliveryPersonName(order.persona_entrega)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 