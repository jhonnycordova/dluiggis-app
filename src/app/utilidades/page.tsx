'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Order {
  id: string;
  platform: 'uber' | 'pedidosya' | 'whatsapp';
  reference?: string;
  amount: number;
  commission?: number;
  netAmount?: number;
  paymentMethod?: string;
  deliveryPerson?: string;
  date: string;
}

interface FinancialSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  netRevenue: number;
  averageOrderValue: number;
}

export default function Utilidades() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [summary, setSummary] = useState<FinancialSummary>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    netRevenue: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(savedOrders);
    applyFilters(selectedYear, selectedMonth, savedOrders);
  }, [selectedYear, selectedMonth]);

  const applyFilters = (year: number, month: number, allOrders: Order[]) => {
    const filtered = allOrders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.getFullYear() === year && orderDate.getMonth() === month;
    });
    setFilteredOrders(filtered);
    calculateSummary(filtered);
  };

  const calculateSummary = (orders: Order[]) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalCommissions = orders.reduce((sum, order) => sum + (order.commission || 0), 0);
    const netRevenue = totalRevenue - totalCommissions;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    setSummary({
      totalOrders,
      totalRevenue,
      totalCommissions,
      netRevenue,
      averageOrderValue
    });
  };

  const handleBack = () => {
    router.push('/');
  };

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
  };

  const getPlatformStats = () => {
    const stats = {
      uber: { orders: 0, revenue: 0, commissions: 0, netRevenue: 0 },
      pedidosya: { orders: 0, revenue: 0, commissions: 0, netRevenue: 0 },
      whatsapp: { orders: 0, revenue: 0, commissions: 0, netRevenue: 0 }
    };

    filteredOrders.forEach(order => {
      stats[order.platform].orders++;
      stats[order.platform].revenue += order.amount;
      stats[order.platform].commissions += order.commission || 0;
      stats[order.platform].netRevenue += (order.amount - (order.commission || 0));
    });

    return stats;
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1 className={styles.title}>Dashboard de Utilidades</h1>
      </div>

      <div className={styles.content}>
        {/* Filtros de tiempo */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="yearFilter">Año:</label>
            <select
              id="yearFilter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={styles.select}
            >
              {getYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="monthFilter">Mes:</label>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={styles.select}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen ejecutivo */}
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>📊</div>
            <div className={styles.cardContent}>
              <h3>Total Pedidos</h3>
              <p className={styles.cardValue}>{summary.totalOrders}</p>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>💰</div>
            <div className={styles.cardContent}>
              <h3>Ingresos Brutos</h3>
              <p className={styles.cardValue}>${formatAmount(summary.totalRevenue)}</p>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>💸</div>
            <div className={styles.cardContent}>
              <h3>Comisiones</h3>
              <p className={styles.cardValue}>${formatAmount(summary.totalCommissions)}</p>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>✅</div>
            <div className={styles.cardContent}>
              <h3>Ingresos Netos</h3>
              <p className={styles.cardValue}>${formatAmount(summary.netRevenue)}</p>
            </div>
          </div>

          {/* <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>📈</div>
            <div className={styles.cardContent}>
              <h3>Ticket Promedio</h3>
              <p className={styles.cardValue}>${formatAmount(summary.averageOrderValue)}</p>
            </div>
          </div> */}
        </div>

        {/* Estadísticas por plataforma */}
        <div className={styles.platformStats}>
          <h2 className={styles.sectionTitle}>Análisis por Plataforma</h2>
          <div className={styles.platformGrid}>
            {Object.entries(getPlatformStats()).map(([platform, stats]) => (
              <div key={platform} className={styles.platformCard}>
                <div className={styles.platformHeader}>
                  <h3 className={styles.platformName}>
                    {platform === 'uber' ? '🚗 Uber' : 
                     platform === 'pedidosya' ? '🍕 PedidosYa' : '📱 WhatsApp'}
                  </h3>
                </div>
                <div className={styles.platformMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Pedidos:</span>
                    <span className={styles.metricValue}>{stats.orders}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Ingresos:</span>
                    <span className={styles.metricValue}>${formatAmount(stats.revenue)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Comisiones:</span>
                    <span className={styles.metricValue}>${formatAmount(stats.commissions)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Neto:</span>
                    <span className={styles.metricValue}>${formatAmount(stats.netRevenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla detallada */}
        <div className={styles.detailedTable}>
          <h2 className={styles.sectionTitle}>Detalle de Pedidos</h2>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Plataforma</th>
                  <th>Monto</th>
                  <th>Comisión</th>
                  <th>Neto</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.date).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className={styles.platformTag}>
                        {order.platform === 'uber' ? '🚗 Uber' : 
                         order.platform === 'pedidosya' ? '🍕 PedidosYa' : '📱 WhatsApp'}
                      </span>
                    </td>
                    <td>${formatAmount(order.amount)}</td>
                    <td>${formatAmount(order.commission || 0)}</td>
                    <td>${formatAmount(order.netAmount || order.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 