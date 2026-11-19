import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { fetchTasks, queryKeys } from '@/lib/queries'
import type { Task, TaskPriority, TaskState } from '@/types'

export interface TaskCreatePayload {
  title: string
  description?: string
  priority?: TaskPriority
  assignee_id?: number | null
}

export interface TaskUpdatePayload {
  title?: string
  description?: string
  priority?: TaskPriority
  state?: TaskState
  assignee_id?: number | null
}

export function useTasks(moduleId: number) {
  return useQuery({
    queryKey: queryKeys.tasks(moduleId),
    queryFn: () => fetchTasks(moduleId),
    enabled: Number.isFinite(moduleId) && moduleId > 0,
  })
}

export function useCreateTask(moduleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: TaskCreatePayload) => {
      const { data } = await api.post<{ message: string; data: Task }>(
        `/modules/${moduleId}/tasks/`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(moduleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
    },
  })
}

export function useUpdateTask(moduleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: number; payload: TaskUpdatePayload }) => {
      const { data } = await api.patch<{ message: string; data: Task }>(
        `/modules/${moduleId}/tasks/${taskId}/`,
        payload,
      )
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(moduleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleDetail(moduleId) })
    },
  })
}

export function useDeleteTask(moduleId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: number) => {
      await api.delete(`/modules/${moduleId}/tasks/${taskId}/`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(moduleId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleDetail(moduleId) })
    },
  })
}
