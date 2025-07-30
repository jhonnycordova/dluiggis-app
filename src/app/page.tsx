'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();

  const handleRegistrarPedido = () => {
    router.push('/registrar-pedido');
  };

  const handleHistorialPedidos = () => {
    router.push('/historial-pedidos');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Sistema de Pedidos</h1>
        
        <div className={styles.buttonContainer}>
          <button 
            onClick={handleRegistrarPedido}
            className={styles.primaryButton}
          >
            Registrar Pedido
          </button>
          
          <button 
            onClick={handleHistorialPedidos}
            className={styles.secondaryButton}
          >
            Historial de Pedidos
          </button>
        </div>
      </main>
    </div>
  );
}
