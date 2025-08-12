'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type ExpenseType = 'salario' | 'insumos' | 'otros';

export default function RegistrarGasto() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'salario' as ExpenseType,
    concept: '',
    amount: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expense = {
      id: Date.now().toString(),
      type: formData.type,
      concept: formData.concept,
      amount: parseFloat(formData.amount),
      date: new Date().toISOString()
    };

    // Save to localStorage
    const existingExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    existingExpenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(existingExpenses));

    alert('Gasto registrado exitosamente!');
    router.push('/');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getExpenseTypeName = (type: ExpenseType) => {
    switch (type) {
      case 'salario': return 'Salario';
      case 'insumos': return 'Insumos';
      case 'otros': return 'Otros';
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          ← Volver
        </button>
        <h1 className={styles.title}>Registrar Gasto</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="type">Tipo de Gasto:</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={styles.select}
                required
              >
                <option value="salario">Salario</option>
                <option value="insumos">Insumos</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="concept">Concepto:</label>
              <input
                type="text"
                id="concept"
                value={formData.concept}
                onChange={(e) => handleInputChange('concept', e.target.value)}
                required
                className={styles.input}
                placeholder="Descripción del gasto"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount">Monto:</label>
              <input
                type="number"
                id="amount"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
                className={styles.input}
                placeholder="0.00"
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={() => router.push('/')} className={styles.cancelButton}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitButton}>
                Registrar Gasto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 