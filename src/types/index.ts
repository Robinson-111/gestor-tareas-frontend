export type GlobalRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'
export type ModuleRole = 'OWNER' | 'MEMBER'
export type ModuleState = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADO'
export type TaskState = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA'
export type TaskPriority = 'BAJA' | 'MEDIA' | 'ALTA'

export interface User {
  id: number
  name: string
  email: string
  created_at?: string
  rol?: GlobalRole
  modules_count?: number
  tasks_count?: number
}

export interface AuthUser {
  id: number
  name: string
  email: string
  rol: GlobalRole
}

export interface Module {
  id: number
  name: string
  description: string
  state: ModuleState
  creator: number | null
  creator_name?: string | null
  created_at: string
  updated_at: string
}

export interface ExploreModule extends Module {
  has_owner: boolean
  owner_name: string | null
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
}

export interface Member {
  id: number
  user_id: number
  name: string
  rol: ModuleRole
}

export interface Task {
  id: number
  title: string
  description: string
  priority: TaskPriority
  state: TaskState
  assignee_id: number | null
  assignee_name: string | null
  module_id: number
  created_at: string
  updated_at: string
}

export interface Paginated<T> {
  total: number
  total_pages: number
  current_page: number
  page_size: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LoginResponse {
  message: string
  access: string
  refresh: string
  user: AuthUser
}

export interface ApiErrorBody {
  message?: string
  errors?: Record<string, string[]>
  code?: string
}

export interface ModuleOverview {
  module: Module
  members: Member[]
  tasks: Task[]
}

export interface TaskWithModule {
  task: Task
  module: Module
  members: Member[]
}
