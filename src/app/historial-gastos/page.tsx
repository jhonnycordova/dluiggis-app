'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { expensesService } from '@/services/expenses';
import { Expense } from '@/types';
import { formatAmount } from '@/utils/calculations';
import Notification from './Notification';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditExpenseModal from './EditExpenseModal';
import styles from './page.module.css';

export default function HistorialGastos() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const allExpenses = await expensesService.getAll();
      setExpenses(allExpenses);

      // Determine which date to show by default
      const now = new Date();
      const currentHour = now.getHours();

      // If it's early morning (before 6 AM), default to yesterday so the
      // previous night's shift stays visible.
      let defaultDate;
      if (currentHour < 6) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        defaultDate = yesterday;
      } else {
        defaultDate = now;
      }

      const defaultDateString = defaultDate.getFullYear() + '-' +
        String(defaultDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(defaultDate.getDate()).padStart(2, '0');

      setSelectedDate(defaultDateString);

      // Apply filter for the default date
      const filtered = allExpenses.filter((expense: Expense) => {
        const expenseDate = new Date(expense.fecha);
        const expenseDateString = expenseDate.getFullYear() + '-' +
          String(expenseDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(expenseDate.getDate()).padStart(2, '0');

        return expenseDateString === defaultDateString;
      });

      setFilteredExpenses(filtered);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      alert('Error al cargar los gastos');
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
      setFilteredExpenses(expenses);
    } else {
      try {
        const startDate = new Date(date + 'T00:00:00');
        const endDate = new Date(date + 'T23:59:59.999');

        const filtered = expenses.filter(expense => {
          const expenseDate = new Date(expense.fecha);
          return expenseDate >= startDate && expenseDate <= endDate;
        });

        setFilteredExpenses(filtered);
      } catch (error) {
        console.error('Error al filtrar por fecha:', error);
        alert('Error al filtrar los gastos');
      }
    }
  };

  const getTypeName = (tipo: string) => {
    switch (tipo) {
      case 'salario': return 'Salario';
      case 'insumos': return 'Insumos';
      case 'gastos_personales': return 'Gastos Personales';
      case 'otros': return 'Otros';
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

  const calculateTotal = (expenses: Expense[]) => {
    return expenses.reduce((total, expense) => total + (expense.monto || 0), 0);
  };

  const getTypeStatistics = (expenses: Expense[]) => {
    const stats = {
      salario: { count: 0, total: 0 },
      insumos: { count: 0, total: 0 },
      gastos_personales: { count: 0, total: 0 },
      otros: { count: 0, total: 0 }
    };

    expenses.forEach(expense => {
      const amount = expense.monto || 0;
      switch (expense.tipo) {
        case 'salario':
          stats.salario.count++;
          stats.salario.total += amount;
          break;
        case 'insumos':
          stats.insumos.count++;
          stats.insumos.total += amount;
          break;
        case 'gastos_personales':
          stats.gastos_personales.count++;
          stats.gastos_personales.total += amount;
          break;
        case 'otros':
          stats.otros.count++;
          stats.otros.total += amount;
          break;
      }
    });

    return stats;
  };

  const handleDeleteClick = (expense: Expense) => {
    setDeletingExpenseId(expense.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpenseId) return;

    setActionLoading(deletingExpenseId);
    try {
      await expensesService.delete(deletingExpenseId);

      setExpenses(prev => prev.filter(e => e.id !== deletingExpenseId));
      setFilteredExpenses(prev => prev.filter(e => e.id !== deletingExpenseId));

      setNotification({ type: 'success', message: 'Gasto eliminado exitosamente' });
      setDeletingExpenseId(null);
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      setNotification({ type: 'error', message: 'Error al eliminar el gasto. Inténtalo de nuevo.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleEditSave = async (updatedData: Partial<Expense>) => {
    if (!editingExpense) return;

    setActionLoading(editingExpense.id);
    try {
      const updated = await expensesService.update(editingExpense.id, updatedData);

      setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
      setFilteredExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));

      setNotification({ type: 'success', message: 'Gasto actualizado exitosamente' });
      setEditingExpense(null);
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
      setNotification({ type: 'error', message: 'Error al actualizar el gasto. Inténtalo de nuevo.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalCancel = () => {
    if (!actionLoading) {
      setDeletingExpenseId(null);
      setEditingExpense(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backButton}>
            ← Volver
          </button>
          <h1 className={styles.title}>Historial de Gastos</h1>
        </div>
        <div className={styles.content}>
          <p>Cargando gastos...</p>
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
        <h1 className={styles.title}>Historial de Gastos</h1>
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
              <p><strong>Total de gastos:</strong> {filteredExpenses.length}</p>
              <p><strong>Total monto día:</strong> ${formatAmount(calculateTotal(filteredExpenses))}</p>
            </div>

            <div className={styles.platformStats}>
              {(() => {
                const stats = getTypeStatistics(filteredExpenses);
                return (
                  <>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>💼</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Salario</div>
                        <div className={styles.statValue}>{stats.salario.count}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.salario.total)}</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>📦</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Insumos</div>
                        <div className={styles.statValue}>{stats.insumos.count}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.insumos.total)}</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>👤</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Gastos Personales</div>
                        <div className={styles.statValue}>{stats.gastos_personales.count}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.gastos_personales.total)}</div>
                      </div>
                    </div>

                    <div className={styles.statCard}>
                      <div className={styles.statIcon}>🧾</div>
                      <div className={styles.statContent}>
                        <div className={styles.statLabel}>Otros</div>
                        <div className={styles.statValue}>{stats.otros.count}</div>
                        <div className={styles.statAmount}>${formatAmount(stats.otros.total)}</div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className={styles.ordersContainer}>
          {filteredExpenses.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay gastos para mostrar</p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.platformBadge}>
                      {getTypeName(expense.tipo)}
                    </div>
                    <div className={styles.orderDate}>
                      {formatDate(expense.fecha)}
                    </div>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.orderInfo}>
                      <p><strong>Concepto:</strong> {expense.concepto}</p>
                      <p><strong>Monto:</strong> ${formatAmount(expense.monto)}</p>
                    </div>
                  </div>

                  <div className={styles.orderActions}>
                    <button
                      onClick={() => handleEditClick(expense)}
                      className={styles.editButton}
                      disabled={actionLoading === expense.id}
                    >
                      {actionLoading === expense.id ? 'Cargando...' : 'Editar'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(expense)}
                      className={styles.deleteButton}
                      disabled={actionLoading === expense.id}
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
        expense={expenses.find(e => e.id === deletingExpenseId) || null}
        isOpen={!!deletingExpenseId}
        onConfirm={handleDeleteConfirm}
        onCancel={handleModalCancel}
        isLoading={!!actionLoading}
      />

      <EditExpenseModal
        expense={editingExpense}
        isOpen={!!editingExpense}
        onSave={handleEditSave}
        onCancel={handleModalCancel}
        isLoading={!!actionLoading}
      />
    </div>
  );
}
