import { api, fetchAll } from '@/lib/api'
import type { ExploreModule, Member, Module, Task, User } from '@/types'

export const queryKeys = {
  modules: ['modules'] as const,
  moduleList: () => [...queryKeys.modules, 'list'] as const,
  moduleDetail: (id: number) => [...queryKeys.modules, 'detail', id] as const,
  exploreModules: () => [...queryKeys.modules, 'explore'] as const,
  claimableModules: () => [...queryKeys.modules, 'claimable'] as const,
  members: (moduleId: number) => ['members', moduleId] as const,
  tasks: (moduleId: number) => ['tasks', moduleId] as const,
  users: ['users'] as const,
}

export async function fetchModules(): Promise<Module[]> {
  return fetchAll<Module>('/modules/')
}

export async function fetchExploreModules(): Promise<ExploreModule[]> {
  return fetchAll<ExploreModule>('/modules/explore/')
}

export async function fetchClaimableModules(): Promise<Module[]> {
  return fetchAll<Module>('/modules/claimable/')
}

export async function fetchModule(id: number): Promise<Module> {
  const { data } = await api.get<Module>(`/modules/${id}/`)
  return data
}

export async function fetchMembers(moduleId: number): Promise<Member[]> {
  const { data } = await api.get<Member[]>(`/modules/${moduleId}/members/`)
  return data
}

export async function fetchTasks(moduleId: number): Promise<Task[]> {
  return fetchAll<Task>(`/modules/${moduleId}/tasks/`)
}

export async function fetchUsers(): Promise<User[]> {
  return fetchAll<User>('/users/')
}
