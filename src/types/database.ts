export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'team-lead' | 'project-manager' | 'member'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'member'
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
          start_date: string | null
          end_date: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'planning' | 'in_progress' | 'completed' | 'on_hold'
          start_date?: string | null
          end_date?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'planning' | 'in_progress' | 'completed' | 'on_hold'
          start_date?: string | null
          end_date?: string | null
          created_by?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          assigned_to: string | null
          status: 'todo' | 'in_progress' | 'done'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          assigned_to?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          assigned_to?: string | null
          status?: 'todo' | 'in_progress' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          created_at?: string
        }
      }
      updates: {
        Row: {
          id: string
          project_id: string
          update_text: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          update_text: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          update_text?: string
          created_by?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'general' | 'meeting' | 'task' | 'project' | 'message'
          data: Record<string, unknown>
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'general' | 'meeting' | 'task' | 'project' | 'message'
          data?: Record<string, unknown>
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'general' | 'meeting' | 'task' | 'project' | 'message'
          data?: Record<string, unknown>
          is_read?: boolean
          created_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'project-manager' | 'member'
          assigned_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'project-manager' | 'member'
          assigned_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'project-manager' | 'member'
          assigned_at?: string
        }
      }
      personal_todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          completed: boolean
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string | null
          tags: string[]
          estimated_time: number | null
          actual_time: number | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          tags?: string[]
          estimated_time?: number | null
          actual_time?: number | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          completed?: boolean
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date?: string | null
          tags?: string[]
          estimated_time?: number | null
          actual_time?: number | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          project_id: string | null
          content: string
          message_type: 'text' | 'file' | 'image'
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id?: string | null
          project_id?: string | null
          content: string
          message_type?: 'text' | 'file' | 'image'
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string | null
          project_id?: string | null
          content?: string
          message_type?: 'text' | 'file' | 'image'
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_dependencies: {
        Row: {
          id: string
          task_id: string
          depends_on_task_id: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          task_id: string
          depends_on_task_id: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          depends_on_task_id?: string
          created_at?: string
          created_by?: string | null
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Update = Database['public']['Tables']['updates']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ProjectMember = Database['public']['Tables']['project_members']['Row']
export type PersonalTodo = Database['public']['Tables']['personal_todos']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type TaskDependency = Database['public']['Tables']['task_dependencies']['Row']

export interface TaskDependencyWithDetails extends TaskDependency {
  dependency_task: Task
  dependent_task: Task
}
