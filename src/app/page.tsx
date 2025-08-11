'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
        <div className={styles.logoContainer}>
          <Image
            src="/logo.png"
            alt="D'Luigis Pizzería & Delivery"
            width={120}
            height={120}
            className={styles.logo}
            priority
          />
        </div>
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
          
          <button 
            onClick={() => router.push('/utilidades')}
            className={styles.tertiaryButton}
          >
            Utilidades
          </button>
        </div>
      </main>
    </div>
  );
}
