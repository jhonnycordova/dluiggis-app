'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

type Platform = 'uber' | 'pedidosya' | 'whatsapp' | null;

export default function RegistrarPedido() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);

  const handleBack = () => {
    router.push('/');
  };

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1 className={styles.title}>Registrar Pedido</h1>
      </div>

      <div className={styles.content}>
        {!selectedPlatform ? (
          <div className={styles.platformSelection}>
            <h2 className={styles.subtitle}>Selecciona la plataforma:</h2>
            <div className={styles.platformButtons}>
              <button
                onClick={() => handlePlatformSelect('uber')}
                className={styles.platformButton}
              >
                <div className={styles.platformIcon}>🚗</div>
                <span>Uber</span>
              </button>
              
              <button
                onClick={() => handlePlatformSelect('pedidosya')}
                className={styles.platformButton}
              >
                <div className={styles.platformIcon}>🍕</div>
                <span>PedidosYa</span>
              </button>
              
              <button
                onClick={() => handlePlatformSelect('whatsapp')}
                className={styles.platformButton}
              >
                <div className={styles.platformIcon}>📱</div>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <OrderForm platform={selectedPlatform} onBack={() => setSelectedPlatform(null)} />
        )}
      </div>
    </div>
  );
}

interface OrderFormProps {
  platform: Platform;
  onBack: () => void;
}

function OrderForm({ platform, onBack }: OrderFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    reference: '',
    amount: '',
    paymentMethod: 'cash',
    deliveryPerson: 'none'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const order = {
      id: Date.now().toString(),
      platform,
      ...formData,
      date: new Date().toISOString(),
      amount: parseFloat(formData.amount)
    };

    // Save to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    alert('Pedido registrado exitosamente!');
    router.push('/');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPlatformName = (platform: Platform) => {
    switch (platform) {
      case 'uber': return 'Uber';
      case 'pedidosya': return 'PedidosYa';
      case 'whatsapp': return 'WhatsApp';
      default: return '';
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <button onClick={onBack} className={styles.backButton}>
          ← Volver
        </button>
        <h2 className={styles.formTitle}>Registrar Pedido - {getPlatformName(platform)}</h2>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {platform === 'uber' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="reference">Referencia:</label>
              <input
                type="text"
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                className={styles.input}
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
              />
            </div>
          </>
        )}

        {platform === 'pedidosya' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="reference">Referencia:</label>
              <input
                type="text"
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                required
                className={styles.input}
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
              />
            </div>
          </>
        )}

        {platform === 'whatsapp' && (
          <>
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
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="paymentMethod">Método de Pago:</label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className={styles.select}
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="card">Tarjeta</option>
              </select>
            </div>
            
            {formData.paymentMethod === 'card' && (
              <div className={styles.formGroup}>
                <label htmlFor="reference">Referencia:</label>
                <input
                  type="text"
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="deliveryPerson">Entrega:</label>
              <select
                id="deliveryPerson"
                value={formData.deliveryPerson}
                onChange={(e) => handleInputChange('deliveryPerson', e.target.value)}
                className={styles.select}
              >
                <option value="none">Sin entrega</option>
                <option value="rosi">Rosi</option>
                <option value="josue">Josue</option>
              </select>
            </div>
          </>
        )}

        <div className={styles.formActions}>
          <button type="button" onClick={onBack} className={styles.cancelButton}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitButton}>
            Registrar Pedido
          </button>
        </div>
      </form>
    </div>
  );
} 