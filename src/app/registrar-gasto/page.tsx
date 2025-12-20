'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { expensesService } from '@/services/expenses';
import styles from './page.module.css';

type ExpenseType = 'salario' | 'insumos' | 'otros';

export default function RegistrarGasto() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tipo: 'salario' as ExpenseType,
    concepto: '',
    monto: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const expenseData = {
        fecha: new Date().toISOString(),
        tipo: formData.tipo,
        concepto: formData.concepto,
        monto: parseFloat(formData.monto)
      };

      await expensesService.create(expenseData);
      
      alert('Gasto registrado exitosamente!');
      router.push('/');
    } catch (error) {
      console.error('Error al registrar gasto:', error);
      alert('Error al registrar el gasto. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <label htmlFor="tipo">Tipo de Gasto:</label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className={styles.select}
                required
              >
                <option value="salario">Salario</option>
                <option value="insumos">Insumos</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="concepto">Concepto:</label>
              <input
                type="text"
                id="concepto"
                value={formData.concepto}
                onChange={(e) => handleInputChange('concepto', e.target.value)}
                required
                className={styles.input}
                placeholder="Descripción del gasto"
              />
            </div>

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
                placeholder="0.00"
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={() => router.push('/')} className={styles.cancelButton}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registrando...' : 'Registrar Gasto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 