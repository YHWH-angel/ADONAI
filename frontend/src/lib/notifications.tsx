import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

interface Notification {
  id: number
  message: string
}

interface NotificationsContextValue {
  notify: (message: string) => void
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined)
// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within NotificationsProvider',
    )
  }
  return ctx
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([])

  const notify = useCallback((message: string) => {
    const id = Date.now()
    setItems((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setItems((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }, [])

  return (
    <NotificationsContext.Provider value={{ notify }}>
      {children}
      <div className="notifications">
        {items.map((n) => (
          <div key={n.id} className="notification">
            {n.message}
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}
