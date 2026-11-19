import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { fetchMembers, fetchUsers, queryKeys } from '@/lib/queries'
import type { Member } from '@/types'

export function useMembers(moduleId: number) {
  return useQuery({
    queryKey: queryKeys.members(moduleId),
    queryFn: () => fetchMembers(moduleId),
    enabled: Number.isFinite(moduleId) && moduleId > 0,
  })
}

export function useAllUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
    enabled,
    staleTime: 60_000,
  })
}

export function useAddMember(moduleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.post<{ message: string; data: Member }>(
        `/modules/${moduleId}/members/`,
        { user_id: userId },
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(moduleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(moduleId) })
    },
  })
}

export function useRemoveMember(moduleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/modules/${moduleId}/members/${userId}/`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(moduleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(moduleId) })
    },
  })
}

export function useTransferOwnership(moduleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.patch<{ message: string; data: Member }>(
        `/modules/${moduleId}/members/${userId}/`,
        {},
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(moduleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleDetail(moduleId) })
    },
  })
}

export function useLeaveModule(moduleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post(`/modules/${moduleId}/leave/`)
    },
    onSuccess: () => {
      // El usuario ya no es integrante: eliminamos la caché del módulo en lugar
      // de invalidarla para no disparar peticiones que responderían 403.
      queryClient.removeQueries({ queryKey: queryKeys.moduleDetail(moduleId) })
      queryClient.removeQueries({ queryKey: queryKeys.members(moduleId) })
      queryClient.removeQueries({ queryKey: queryKeys.tasks(moduleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.claimableModules() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.exploreModules() })
    },
  })
}
