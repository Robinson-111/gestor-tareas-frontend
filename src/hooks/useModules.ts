import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  fetchClaimableModules,
  fetchExploreModules,
  fetchMembers,
  fetchModule,
  fetchModules,
  fetchTasks,
  queryKeys,
} from '@/lib/queries'
import type { Module, ModuleOverview } from '@/types'

export interface ModulePayload {
  name: string
  description?: string
  members?: number[]
}

export interface ModuleUpdatePayload {
  name?: string
  description?: string
  state?: Module['state']
}

export function useModules() {
  return useQuery({
    queryKey: queryKeys.moduleList(),
    queryFn: fetchModules,
  })
}

export function useModule(id: number) {
  return useQuery({
    queryKey: queryKeys.moduleDetail(id),
    queryFn: () => fetchModule(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useExploreModules() {
  return useQuery({
    queryKey: queryKeys.exploreModules(),
    queryFn: fetchExploreModules,
  })
}

export function useClaimableModules() {
  return useQuery({
    queryKey: queryKeys.claimableModules(),
    queryFn: fetchClaimableModules,
  })
}

/**
 * Combina los módulos del usuario con sus integrantes y tareas para pintar
 * las tarjetas del dashboard con contadores y avatares reales.
 */
export function useModulesOverview() {
  const modulesQuery = useModules()
  const modules = modulesQuery.data ?? []

  const memberQueries = useQueries({
    queries: modules.map((module) => ({
      queryKey: queryKeys.members(module.id),
      queryFn: () => fetchMembers(module.id),
      staleTime: 60_000,
    })),
  })

  const taskQueries = useQueries({
    queries: modules.map((module) => ({
      queryKey: queryKeys.tasks(module.id),
      queryFn: () => fetchTasks(module.id),
      staleTime: 60_000,
    })),
  })

  const overviews: ModuleOverview[] = modules.map((module, index) => ({
    module,
    members: memberQueries[index]?.data ?? [],
    tasks: taskQueries[index]?.data ?? [],
  }))

  return {
    modulesQuery,
    overviews,
    isEnriching:
      memberQueries.some((query) => query.isLoading) ||
      taskQueries.some((query) => query.isLoading),
  }
}

/**
 * Vista agregada del espacio de trabajo: módulos, integrantes y todas las
 * tareas del usuario con su módulo de origen. Se apoya en las consultas ya
 * cacheadas por `useModulesOverview`.
 */
export function useWorkspaceOverview() {
  const { modulesQuery, overviews, isEnriching } = useModulesOverview()

  const allTasks = useMemo(
    () =>
      overviews.flatMap(({ module, members, tasks }) =>
        tasks.map((task) => ({ task, module, members })),
      ),
    [overviews],
  )

  const pendingTasks = useMemo(
    () => allTasks.filter(({ task }) => task.state !== 'COMPLETADA'),
    [allTasks],
  )

  const activeModules = useMemo(
    () => overviews.filter(({ module }) => module.state !== 'COMPLETADO').length,
    [overviews],
  )

  return {
    modulesQuery,
    overviews,
    isEnriching,
    allTasks,
    pendingTasks,
    activeModules,
  }
}

export function useCreateModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ModulePayload) => {
      const { data } = await api.post<{ message: string; data: Module }>('/modules/', payload)
      return data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.claimableModules() })
    },
  })
}

export function useUpdateModule(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ModuleUpdatePayload) => {
      const { data } = await api.patch<{ message: string; data: Module }>(
        `/modules/${id}/`,
        payload,
      )
      return data.data
    },
    onSuccess: (module) => {
      queryClient.setQueryData(queryKeys.moduleDetail(id), module)
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.claimableModules() })
    },
  })
}

export function useDeleteModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/modules/${id}/`)
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.moduleDetail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.claimableModules() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.exploreModules() })
    },
  })
}

export function useJoinModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<{ message: string; data: unknown }>(
        `/modules/${id}/join/`,
      )
      return data
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exploreModules() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleDetail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(id) })
    },
  })
}

export function useClaimModule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      // Ruta canónica sin slash final.
      const { data } = await api.patch(`/modules/${id}/claim`)
      return data
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exploreModules() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleList() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.claimableModules() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.moduleDetail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(id) })
    },
  })
}
