export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            activities: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    metadata: Json | null
                    title: string
                    type: Database["public"]["Enums"]["activity_type"]
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    metadata?: Json | null
                    title: string
                    type: Database["public"]["Enums"]["activity_type"]
                    user_id: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    metadata?: Json | null
                    title?: string
                    type?: Database["public"]["Enums"]["activity_type"]
                    user_id?: string
                }
                Relationships: []
            }
            events: {
                Row: {
                    created_at: string
                    date: string
                    end_time: string
                    id: string
                    participants: string[] | null
                    start_time: string
                    title: string
                    type: Database["public"]["Enums"]["event_type"]
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    date: string
                    end_time: string
                    id?: string
                    participants?: string[] | null
                    start_time: string
                    title: string
                    type?: Database["public"]["Enums"]["event_type"]
                    user_id: string
                }
                Update: {
                    created_at?: string
                    date?: string
                    end_time?: string
                    id?: string
                    participants?: string[] | null
                    start_time?: string
                    title?: string
                    type?: Database["public"]["Enums"]["event_type"]
                    user_id?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    full_name: string | null
                    id: string
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id: string
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id?: string
                    updated_at?: string
                }
                Relationships: []
            }
            projects: {
                Row: {
                    created_at: string
                    deadline: string | null
                    description: string | null
                    id: string
                    name: string
                    priority: Database["public"]["Enums"]["priority_level"]
                    progress: number | null
                    status: Database["public"]["Enums"]["project_status"]
                    team_size: number | null
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    deadline?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    priority?: Database["public"]["Enums"]["priority_level"]
                    progress?: number | null
                    status?: Database["public"]["Enums"]["project_status"]
                    team_size?: number | null
                    user_id: string
                }
                Update: {
                    created_at?: string
                    deadline?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    priority?: Database["public"]["Enums"]["priority_level"]
                    progress?: number | null
                    status?: Database["public"]["Enums"]["project_status"]
                    team_size?: number | null
                    user_id?: string
                }
                Relationships: []
            }
            tasks: {
                Row: {
                    assignee: string | null
                    column_id: Database["public"]["Enums"]["task_column"]
                    created_at: string
                    due_date: string | null
                    id: string
                    priority: Database["public"]["Enums"]["priority_level"]
                    progress: number | null
                    project_id: string | null
                    title: string
                    user_id: string
                }
                Insert: {
                    assignee?: string | null
                    column_id?: Database["public"]["Enums"]["task_column"]
                    created_at?: string
                    due_date?: string | null
                    id?: string
                    priority?: Database["public"]["Enums"]["priority_level"]
                    progress?: number | null
                    project_id?: string | null
                    title: string
                    user_id: string
                }
                Update: {
                    assignee?: string | null
                    column_id?: Database["public"]["Enums"]["task_column"]
                    created_at?: string
                    due_date?: string | null
                    id?: string
                    priority?: Database["public"]["Enums"]["priority_level"]
                    progress?: number | null
                    project_id?: string | null
                    title?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            activity_type: "project" | "task" | "comment" | "status" | "assignment"
            event_type: "project" | "task" | "personal"
            priority_level: "low" | "medium" | "high"
            project_status: "active" | "planning" | "review" | "completed"
            task_column: "todo" | "inprogress" | "done"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
