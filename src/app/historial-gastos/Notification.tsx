'use client'

import { useEffect } from 'react'
import styles from './Notification.module.css'

interface NotificationProps {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

export default function Notification({ type, message, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <p>{message}</p>
      <button onClick={onClose} className={styles.closeButton}>
        ×
      </button>
    </div>
  )
}
