import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '@/lib/api'
import { queryKeys, type NotificationsResponse } from '@/lib/queries'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/stores/toast'
import type { Notification } from '@/types'

/**
 * Subprotocolo con el que viaja el JWT en el handshake.
 *
 * El `WebSocket` del navegador no permite cabeceras personalizadas, así que
 * el token se envía como segundo valor de `Sec-WebSocket-Protocol`:
 * `['taskflow.jwt', '<access>']`. El backend lo valida en el middleware ASGI.
 */
const JWT_SUBPROTOCOL = 'taskflow.jwt'
const PING_INTERVAL = 25_000
const MAX_RECONNECT_DELAY = 30_000

function buildSocketUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined
  if (explicit) return explicit

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/notifications/`
}

interface UnreadCountMessage {
  type: 'unread_count'
  count: number
}

interface NotificationMessage {
  type: 'notification'
  notification: Notification
  unread_count: number
}

type ServerMessage = UnreadCountMessage | NotificationMessage | { type: 'pong' }

/**
 * Mantiene abierto el canal de notificaciones del usuario.
 *
 * - Empuja los eventos al caché de React Query y muestra un toast.
 * - Reconecta con backoff exponencial.
 * - Si el backend cierra con 4401 (token inválido/expirado) refresca el JWT
 *   por REST y vuelve a conectar.
 */
export function useNotificationsSocket() {
  const queryClient = useQueryClient()
  const access = useAuthStore((state) => state.access)
  const userId = useAuthStore((state) => state.user?.id)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<number | null>(null)
  const pingRef = useRef<number | null>(null)
  const attemptsRef = useRef(0)
  const closedByUsRef = useRef(false)

  useEffect(() => {
    if (!access || !userId) return

    closedByUsRef.current = false
    attemptsRef.current = 0
    let token = access

    const clearTimers = () => {
      if (reconnectRef.current !== null) {
        window.clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
      if (pingRef.current !== null) {
        window.clearInterval(pingRef.current)
        pingRef.current = null
      }
    }

    const applyUnreadCount = (count: number) => {
      queryClient.setQueryData<NotificationsResponse>(
        queryKeys.notificationList(),
        (previous) => (previous ? { ...previous, unread_count: count } : previous),
      )
    }

    const handleMessage = (raw: string) => {
      let message: ServerMessage

      try {
        message = JSON.parse(raw) as ServerMessage
      } catch {
        return
      }

      if (message.type === 'unread_count') {
        applyUnreadCount(message.count)
        return
      }

      if (message.type !== 'notification') return

      const { notification, unread_count: unreadCount } = message

      queryClient.setQueryData<NotificationsResponse>(
        queryKeys.notificationList(),
        (previous) => {
          if (!previous) return previous
          if (previous.results.some((item) => item.id === notification.id)) {
            return { ...previous, unread_count: unreadCount }
          }

          return {
            ...previous,
            unread_count: unreadCount,
            total: previous.total + 1,
            results: [notification, ...previous.results].slice(0, 20),
          }
        },
      )

      toast.info(notification.title, notification.message || undefined)

      // Los datos del tablero cambian con el evento: refrescamos sin recargar.
      void queryClient.invalidateQueries({ queryKey: queryKeys.modules })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }

    const refreshAccess = async (): Promise<string | null> => {
      const refresh = useAuthStore.getState().refresh
      if (!refresh) return null

      try {
        const { data } = await axios.post<{ access: string; refresh: string }>(
          `${API_URL}/auth/refresh/`,
          { refresh },
        )
        useAuthStore.getState().setTokens(data.access, data.refresh)
        return data.access
      } catch {
        useAuthStore.getState().clear()
        return null
      }
    }

    const scheduleReconnect = (immediate = false) => {
      if (closedByUsRef.current) return

      const delay = immediate
        ? 0
        : Math.min(MAX_RECONNECT_DELAY, 1_000 * 2 ** attemptsRef.current)
      attemptsRef.current += 1
      reconnectRef.current = window.setTimeout(connect, delay)
    }

    function connect() {
      if (closedByUsRef.current) return

      const current = socketRef.current
      if (current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) {
        return
      }

      const socket = new WebSocket(buildSocketUrl(), [JWT_SUBPROTOCOL, token])
      socketRef.current = socket

      socket.onopen = () => {
        attemptsRef.current = 0
        if (pingRef.current !== null) window.clearInterval(pingRef.current)
        pingRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL)
      }

      socket.onmessage = (event) => {
        if (typeof event.data === 'string') handleMessage(event.data)
      }

      socket.onclose = (event) => {
        if (pingRef.current !== null) {
          window.clearInterval(pingRef.current)
          pingRef.current = null
        }
        if (socketRef.current === socket) socketRef.current = null
        if (closedByUsRef.current) return

        if (event.code === 4401) {
          void refreshAccess().then((next) => {
            if (!next) return
            token = next
            scheduleReconnect(true)
          })
          return
        }

        scheduleReconnect()
      }

      socket.onerror = () => {
        socket.close()
      }
    }

    const onOnline = () => {
      if (!socketRef.current) connect()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !socketRef.current) connect()
    }

    connect()
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      closedByUsRef.current = true
      clearTimers()
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisibility)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [access, userId, queryClient])
}
