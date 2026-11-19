import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  fetchNotifications,
  queryKeys,
  type NotificationsResponse,
} from '@/lib/queries'

/**
 * Notificaciones del usuario autenticado.
 *
 * La campana vive en el layout, así que la query se mantiene siempre activa:
 * el WebSocket actualiza esta misma entrada de caché cuando llega un evento.
 */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notificationList(),
    queryFn: () => fetchNotifications({ pageSize: 20 }),
    staleTime: 30_000,
  })
}

function updateCachedRead(id: number) {
  return (previous: NotificationsResponse | undefined) => {
    if (!previous) return previous

    const target = previous.results.find((item) => item.id === id)
    if (!target || target.is_read) return previous

    return {
      ...previous,
      unread_count: Math.max(0, previous.unread_count - 1),
      results: previous.results.map((item) =>
        item.id === id ? { ...item, is_read: true } : item,
      ),
    }
  }
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/notifications/${id}/read/`)
    },
    onMutate: (id) => {
      void queryClient.cancelQueries({ queryKey: queryKeys.notificationList() })
      queryClient.setQueryData<NotificationsResponse>(
        queryKeys.notificationList(),
        updateCachedRead(id),
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all/')
    },
    onMutate: () => {
      void queryClient.cancelQueries({ queryKey: queryKeys.notificationList() })
      queryClient.setQueryData<NotificationsResponse>(
        queryKeys.notificationList(),
        (previous) =>
          previous
            ? {
                ...previous,
                unread_count: 0,
                results: previous.results.map((item) => ({ ...item, is_read: true })),
              }
            : previous,
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/notifications/${id}/delete/`)
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationList() })

      queryClient.setQueryData<NotificationsResponse | undefined>(
        queryKeys.notificationList(),
        (previous) => {
          if (!previous) return previous

          const target = previous.results.find((item) => item.id === id)
          if (!target) return previous

          return {
            ...previous,
            unread_count: Math.max(
              0,
              previous.unread_count - (target.is_read ? 0 : 1),
            ),
            results: previous.results.filter((item) => item.id !== id),
          }
        },
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete('/notifications/delete-all/')
    },
    onMutate: () => {
      void queryClient.cancelQueries({ queryKey: queryKeys.notificationList() })
      queryClient.setQueryData<NotificationsResponse | undefined>(
        queryKeys.notificationList(),
        () => ({
          total: 0,
          total_pages: 0,
          current_page: 1,
          page_size: 20,
          next: null,
          previous: null,
          results: [],
          unread_count: 0,
        }),
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}
