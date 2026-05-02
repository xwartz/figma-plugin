import React, {
  forwardRef,
  type Ref,
  useEffect,
  useImperativeHandle,
} from 'react'

import { Text } from 'react-figma-ui/ui'
import styles from './styles.module.css'

export interface ToastRefI {
  show: (params: ToastIPropsI) => void
}

interface ToastItem extends ToastIPropsI {
  id: number
}

export const Toast = forwardRef<ToastRefI, Record<string, never>>(
  (_, ref: Ref<ToastRefI>) => {
    const [toasts, setToasts] = React.useState<ToastItem[]>([])
    const nextToastIdRef = React.useRef(0)

    const handleClose = React.useCallback((id: number) => {
      setToasts((currentToasts) => {
        const toast = currentToasts.find((item) => item.id === id)
        toast?.options?.onClose?.()

        return currentToasts.filter((item) => item.id !== id)
      })
    }, [])

    useImperativeHandle(ref, () => ({
      show: (params) => {
        setToasts((currentToasts) => [
          ...currentToasts,
          {
            id: nextToastIdRef.current++,
            title: params.title ?? 'Title',
            message: params.message,
            options: {
              type: params.options?.type ?? 'info',
              timeout: params.options?.timeout ?? 5000,
              onClose: params.options?.onClose,
            },
          },
        ])
      },
    }))

    useEffect(() => {
      const firstToast = toasts[0]

      if (!firstToast || firstToast.options?.type === 'error') {
        return
      }

      const timeout = setTimeout(() => {
        handleClose(firstToast.id)
      }, firstToast.options?.timeout || 3000)

      return () => clearTimeout(timeout)
    }, [toasts, handleClose])

    return (
      <div className={styles.toastContainer}>
        <div className={styles.toastWrapper}>
          {toasts.map((toast) => (
            <button
              type="button"
              key={toast.id}
              className={`${styles.toast} ${styles[toast.options.type ?? 'info']}`}
              onClick={() => handleClose(toast.id)}
            >
              <Text fontWeight="bold" className={styles.title}>
                {toast.options.type === 'error'
                  ? '⛔️ '
                  : toast.options.type === 'warn'
                    ? '⚠️ '
                    : '🎉 '}
                {toast.title}
              </Text>

              <Text className={styles.message}>{toast.message}</Text>
            </button>
          ))}
        </div>
      </div>
    )
  },
)
