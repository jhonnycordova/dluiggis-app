'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersService } from '@/services/orders';
import { calculateCommission, calculateNetAmount } from '@/utils/calculations';
import styles from './page.module.css';

type Platform = 'uber' | 'pedidosya' | 'whatsapp' | null;

export default function RegistrarPedido() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <OrderForm 
            platform={selectedPlatform} 
            onBack={() => setSelectedPlatform(null)}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        )}
      </div>
    </div>
  );
}

interface OrderFormProps {
  platform: Platform;
  onBack: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

function OrderForm({ platform, onBack, isSubmitting, setIsSubmitting }: OrderFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    referencia: '',
    monto: '',
    metodo_pago: 'efectivo',
    persona_entrega: 'none',
    tipo_tarjeta: 'debito',
    pagado_efectivo: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const monto = parseFloat(formData.monto);
      const comision = calculateCommission(platform!, monto, formData.metodo_pago, formData.tipo_tarjeta as 'debito' | 'credito');
      const monto_neto = calculateNetAmount(
        monto,
        comision,
        platform === 'whatsapp' ? formData.persona_entrega : undefined
      );

      const orderData = {
        fecha: new Date().toISOString(),
        plataforma: platform!,
        referencia: formData.referencia || undefined,
        monto: monto,
        comision: comision > 0 ? comision : undefined,
        monto_neto: monto_neto,
        metodo_pago: platform === 'whatsapp' ? formData.metodo_pago : undefined,
        persona_entrega: platform === 'whatsapp' ? formData.persona_entrega : undefined,
        tipo_tarjeta: platform === 'whatsapp' && formData.metodo_pago === 'tarjeta' ? formData.tipo_tarjeta : undefined,
        pagado_efectivo: platform === 'pedidosya' ? formData.pagado_efectivo : undefined
      };

      await ordersService.create(orderData);
      
      alert('Pedido registrado exitosamente!');
      router.push('/');
    } catch (error) {
      console.error('Error al registrar pedido:', error);
      alert('Error al registrar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'pagado_efectivo' ? value === 'true' : value
    }));
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
              <label htmlFor="referencia">Referencia:</label>
              <input
                type="text"
                id="referencia"
                value={formData.referencia}
                onChange={(e) => handleInputChange('referencia', e.target.value)}
                className={styles.input}
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
              />
            </div>
          </>
        )}

        {platform === 'pedidosya' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="referencia">Referencia:</label>
              <input
                type="text"
                id="referencia"
                value={formData.referencia}
                onChange={(e) => handleInputChange('referencia', e.target.value)}
                required
                className={styles.input}
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
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.pagado_efectivo}
                  onChange={(e) => handleInputChange('pagado_efectivo', e.target.checked.toString())}
                  className={styles.checkbox}
                />
                <span>Pagado en efectivo</span>
              </label>
            </div>
          </>
        )}

        {platform === 'whatsapp' && (
          <>
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
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="metodo_pago">Método de Pago:</label>
              <select
                id="metodo_pago"
                value={formData.metodo_pago}
                onChange={(e) => handleInputChange('metodo_pago', e.target.value)}
                className={styles.select}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            {formData.metodo_pago === 'tarjeta' && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="tipo_tarjeta">Tipo de Tarjeta:</label>
                  <select
                    id="tipo_tarjeta"
                    value={formData.tipo_tarjeta}
                    onChange={(e) => handleInputChange('tipo_tarjeta', e.target.value)}
                    className={styles.select}
                    required
                  >
                    <option value="debito">Débito (2%)</option>
                    <option value="credito">Crédito (4%)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="referencia">Referencia:</label>
                  <input
                    type="text"
                    id="referencia"
                    value={formData.referencia}
                    onChange={(e) => handleInputChange('referencia', e.target.value)}
                    required
                    className={styles.input}
                  />
                </div>
              </>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="persona_entrega">Entrega:</label>
              <select
                id="persona_entrega"
                value={formData.persona_entrega}
                onChange={(e) => handleInputChange('persona_entrega', e.target.value)}
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
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
} 