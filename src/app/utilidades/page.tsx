'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ordersService } from '@/services/orders';
import { expensesService } from '@/services/expenses';
import { Order, Expense } from '@/types';
import { formatAmount } from '@/utils/calculations';
import styles from './page.module.css';

interface FinancialSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  netRevenue: number;
  totalExpenses: number;
  finalProfit: number;
  averageOrderValue: number;
}

export default function Utilidades() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    netRevenue: 0,
    totalExpenses: 0,
    finalProfit: 0,
    averageOrderValue: 0
  });

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allOrders, allExpenses] = await Promise.all([
        ordersService.getAll(),
        expensesService.getAll()
      ]);
      
      setOrders(allOrders);
      setExpenses(allExpenses);
      applyFilters(selectedYear, selectedMonth, allOrders, allExpenses);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async (year: number, month: number, allOrders: Order[], allExpenses: Expense[]) => {
    try {
      // For month filtering, we need to consider the full month in local timezone
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      // Convert local dates to UTC for Supabase query
      const utcStartDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
      const utcEndDate = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000));
      
      // Filter orders and expenses that fall within the local month range
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.fecha);
        return orderDate >= utcStartDate && orderDate <= utcEndDate;
      });
      
      const filteredExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.fecha);
        return expenseDate >= utcStartDate && expenseDate <= utcEndDate;
      });
      
      setFilteredOrders(filteredOrders);
      setFilteredExpenses(filteredExpenses);
      calculateSummary(filteredOrders, filteredExpenses);
    } catch (error) {
      console.error('Error al aplicar filtros:', error);
      alert('Error al filtrar los datos');
    }
  };

  const calculateSummary = (orders: Order[], expenses: Expense[]) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.monto, 0);
    const totalCommissions = orders.reduce((sum, order) => sum + (order.comision || 0), 0);

    // Siempre usar monto_neto (ahora siempre existe)
    const netRevenue = orders.reduce((sum, order) => sum + order.monto_neto, 0);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.monto, 0);
    const finalProfit = netRevenue - totalExpenses;

    setSummary({
      totalOrders,
      totalRevenue,
      totalCommissions,
      netRevenue,
      totalExpenses,
      finalProfit,
      averageOrderValue: totalOrders > 0 ? netRevenue / totalOrders : 0
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
      stats[order.plataforma].orders++;
      stats[order.plataforma].revenue += order.monto;
      stats[order.plataforma].commissions += order.comision || 0;
      stats[order.plataforma].netRevenue += order.monto_neto;
    });

    return stats;
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      years.push(year);
    }
    return years;
  };

  // Datos para gráficos
  const getChartData = () => {
    const platformStats = getPlatformStats();
    return [
      { name: 'Uber', ingresos: platformStats.uber.revenue, comisiones: platformStats.uber.commissions, neto: platformStats.uber.netRevenue },
      { name: 'PedidosYa', ingresos: platformStats.pedidosya.revenue, comisiones: platformStats.pedidosya.commissions, neto: platformStats.pedidosya.netRevenue },
      { name: 'WhatsApp', ingresos: platformStats.whatsapp.revenue, comisiones: platformStats.whatsapp.commissions, neto: platformStats.whatsapp.netRevenue }
    ];
  };

  const getExpensePieData = () => {
    const expenseTypes = {
      salario: { name: 'Salario', value: 0, color: '#FF6B35' },
      insumos: { name: 'Insumos', value: 0, color: '#228B22' },
      otros: { name: 'Otros', value: 0, color: '#C41E3A' }
    };

    filteredExpenses.forEach(expense => {
      expenseTypes[expense.tipo].value += expense.monto;
    });

    return Object.values(expenseTypes).filter(item => item.value > 0);
  };

  const getRevenueLineData = () => {
    // Últimos 7 días
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayString = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      
      // Create local date range for the day
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      
      // Convert to UTC for comparison with Supabase dates
      const utcStartOfDay = new Date(startOfDay.getTime() - (startOfDay.getTimezoneOffset() * 60000));
      const utcEndOfDay = new Date(endOfDay.getTime() - (endOfDay.getTimezoneOffset() * 60000));
      
      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.fecha);
        return orderDate >= utcStartOfDay && orderDate <= utcEndOfDay;
      });

      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.monto_neto, 0);

      days.push({ name: dayString, ingresos: dayRevenue });
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Volver
          </button>
          <h1 className={styles.title}>Dashboard de Utilidades</h1>
        </div>
        <div className={styles.content}>
          <p>Cargando datos...</p>
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
          
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}>💸</div>
            <div className={styles.cardContent}>
              <h3>Total Egresos</h3>
              <p className={styles.cardValue}>${formatAmount(summary.totalExpenses)}</p>
            </div>
          </div>
          
          <div className={`${styles.summaryCard} ${styles.profitCard}`}>
            <div className={styles.cardIcon}>💰</div>
            <div className={styles.cardContent}>
              <h3>Utilidad Final</h3>
              <p className={styles.cardValue}>${formatAmount(summary.finalProfit)}</p>
            </div>
          </div>
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

        {/* Gráficos */}
        <div className={styles.chartsSection}>
          <h2 className={styles.sectionTitle}>Gráficos de Análisis</h2>
          
          <div className={styles.chartsGrid}>
            {/* Gráfico de barras por plataforma */}
            <div className={styles.chartCard}>
              <h3>Ingresos por Plataforma</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${formatAmount(Number(value))}`} />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#228B22" name="Ingresos" />
                    <Bar dataKey="comisiones" fill="#C41E3A" name="Comisiones" />
                    <Bar dataKey="neto" fill="#FFD700" name="Neto" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de línea de ingresos diarios */}
            <div className={styles.chartCard}>
              <h3>Ingresos Netos - Últimos 7 Días</h3>
              <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getRevenueLineData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${formatAmount(Number(value))}`} />
                    <Line type="monotone" dataKey="ingresos" stroke="#228B22" strokeWidth={3} name="Ingresos Netos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de pie de egresos */}
            {filteredExpenses.length > 0 && (
              <div className={styles.chartCard}>
                <h3>Distribución de Egresos</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getExpensePieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getExpensePieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${formatAmount(Number(value))}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla detallada de pedidos */}
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
                    <td>{new Date(order.fecha).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className={styles.platformTag}>
                        {order.plataforma === 'uber' ? '🚗 Uber' : 
                         order.plataforma === 'pedidosya' ? '🍕 PedidosYa' : '📱 WhatsApp'}
                      </span>
                    </td>
                    <td>${formatAmount(order.monto)}</td>
                    <td>${formatAmount(order.comision || 0)}</td>
                    <td>${formatAmount(order.monto_neto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla detallada de egresos */}
        {filteredExpenses.length > 0 && (
          <div className={styles.detailedTable}>
            <h2 className={styles.sectionTitle}>Detalle de Egresos</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.fecha).toLocaleDateString('es-ES')}</td>
                      <td>
                        <span className={styles.expenseTag}>
                          {expense.tipo === 'salario' ? '👷 Salario' : 
                           expense.tipo === 'insumos' ? '🥬 Insumos' : '📦 Otros'}
                        </span>
                      </td>
                      <td>{expense.concepto}</td>
                      <td>${formatAmount(expense.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 