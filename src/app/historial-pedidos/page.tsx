'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Order {
  id: string;
  platform: 'uber' | 'pedidosya' | 'whatsapp';
  reference?: string;
  amount: number;
  paymentMethod?: string;
  deliveryPerson?: string;
  date: string;
}

export default function HistorialPedidos() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(savedOrders);
    
    // Set current date as default
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    setSelectedDate(todayString);
    
    // Apply filter for current date
    const filtered = savedOrders.filter((order: Order) => {
      const orderDate = new Date(order.date);
      const orderDateString = orderDate.getFullYear() + '-' + 
        String(orderDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(orderDate.getDate()).padStart(2, '0');
      return orderDateString === todayString;
    });
    setFilteredOrders(filtered);
  }, []);

  const handleBack = () => {
    router.push('/');
  };

  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    if (!date) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        const orderDate = new Date(order.date);
        const orderDateString = orderDate.getFullYear() + '-' + 
          String(orderDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(orderDate.getDate()).padStart(2, '0');
        return orderDateString === date;
      });
      setFilteredOrders(filtered);
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
      case 'cash': return 'Efectivo';
      case 'transfer': return 'Transferencia';
      case 'card': return 'Tarjeta';
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
    return orders.reduce((total, order) => total + order.amount, 0);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

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
                      {getPlatformName(order.platform)}
                    </div>
                    <div className={styles.orderDate}>
                      {formatDate(order.date)}
                    </div>
                  </div>
                  
                  <div className={styles.orderDetails}>
                    <div className={styles.orderInfo}>
                      <p><strong>Monto:</strong> ${formatAmount(order.amount)}</p>
                      {order.reference && (
                        <p><strong>Referencia:</strong> {order.reference}</p>
                      )}
                      {order.paymentMethod && order.platform === 'whatsapp' && (
                        <p><strong>Método de Pago:</strong> {getPaymentMethodName(order.paymentMethod)}</p>
                      )}
                      {order.deliveryPerson && order.platform === 'whatsapp' && (
                        <p><strong>Entrega:</strong> {getDeliveryPersonName(order.deliveryPerson)}</p>
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