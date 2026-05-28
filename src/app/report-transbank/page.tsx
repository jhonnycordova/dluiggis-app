'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersService } from '@/services/orders';
import { Order } from '@/types';
import { formatAmount, isTransbankOrder, getTransbankNet } from '@/utils/calculations';
import styles from './page.module.css';

export default function ReportTransbank() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const toLocalDateString = (date: Date) =>
    date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const allOrders = await ordersService.getAll();
      const transbankOrders = allOrders.filter(isTransbankOrder);
      setOrders(transbankOrders);

      // Fecha por defecto: antes de las 6 AM mostramos ayer (turno de la noche
      // anterior), si no, hoy.
      const now = new Date();
      let defaultDate = now;
      if (now.getHours() < 6) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        defaultDate = yesterday;
      }
      const defaultDateString = toLocalDateString(defaultDate);
      setSelectedDate(defaultDateString);

      const filtered = transbankOrders.filter((order) =>
        toLocalDateString(new Date(order.fecha)) === defaultDateString
      );
      setFilteredOrders(filtered);
    } catch (error) {
      console.error('Error al cargar pedidos Transbank:', error);
      alert('Error al cargar los pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    if (!date) {
      setFilteredOrders(orders);
      return;
    }
    const startDate = new Date(date + 'T00:00:00');
    const endDate = new Date(date + 'T23:59:59.999');
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.fecha);
      return orderDate >= startDate && orderDate <= endDate;
    });
    setFilteredOrders(filtered);
  };

  const getCardTypeName = (tipo?: string) => {
    switch (tipo) {
      case 'debito': return 'Débito';
      case 'credito': return 'Crédito';
      default: return 'Tarjeta';
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

  const getSummary = (list: Order[]) => {
    const summary = {
      total: 0,
      debito: { count: 0, total: 0 },
      credito: { count: 0, total: 0 }
    };
    list.forEach(order => {
      const net = getTransbankNet(order);
      summary.total += net;
      if (order.tipo_tarjeta === 'credito') {
        summary.credito.count++;
        summary.credito.total += net;
      } else {
        summary.debito.count++;
        summary.debito.total += net;
      }
    });
    return summary;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Volver
          </button>
          <h1 className={styles.title}>Reporte Transbank</h1>
        </div>
        <div className={styles.content}>
          <p style={{ color: 'white' }}>Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  const summary = getSummary(filteredOrders);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1 className={styles.title}>Reporte Transbank</h1>
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
              <p><strong>Pedidos Transbank:</strong> {filteredOrders.length}</p>
              <p><strong>Transbank te debe:</strong> ${formatAmount(summary.total)}</p>
            </div>

            <div className={styles.platformStats}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💳</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Débito (2%)</div>
                  <div className={styles.statValue}>{summary.debito.count}</div>
                  <div className={styles.statAmount}>${formatAmount(summary.debito.total)}</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>💳</div>
                <div className={styles.statContent}>
                  <div className={styles.statLabel}>Crédito (4%)</div>
                  <div className={styles.statValue}>{summary.credito.count}</div>
                  <div className={styles.statAmount}>${formatAmount(summary.credito.total)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.ordersContainer}>
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay pedidos Transbank para mostrar</p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {filteredOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.platformBadge}>
                      {getCardTypeName(order.tipo_tarjeta)}
                    </div>
                    <div className={styles.orderDate}>
                      {formatDate(order.fecha)}
                    </div>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.orderInfo}>
                      <p><strong>Monto:</strong> ${formatAmount(order.monto)}</p>
                      {order.comision && order.comision > 0 && (
                        <p><strong>Comisión ({order.tipo_tarjeta === 'credito' ? '4%' : '2%'}):</strong> ${formatAmount(order.comision)}</p>
                      )}
                      <p><strong>Transbank te debe:</strong> ${formatAmount(getTransbankNet(order))}</p>
                      {order.referencia && (
                        <p><strong>Referencia:</strong> {order.referencia}</p>
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
