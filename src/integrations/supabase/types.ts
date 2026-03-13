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
                    client_id: string | null
                    client_name: string | null
                    value: number | null
                    services: Json | null
                    billing_type: "pontual" | "recorrente" | null
                    service_type: string | null
                    contract_status: "active" | "expired" | "pending" | null
                    next_billing_date: string | null
                    billing_cycle: string | null
                    advance_payment: number | null
                    payment_method: string | null
                    payment_status: string | null
                    avatar_emoji: string | null
                    manager_name: string | null
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
                    client_id?: string | null
                    client_name?: string | null
                    value?: number | null
                    services?: Json | null
                    billing_type?: "pontual" | "recorrente" | null
                    service_type?: string | null
                    contract_status?: "active" | "expired" | "pending" | null
                    next_billing_date?: string | null
                    billing_cycle?: string | null
                    advance_payment?: number | null
                    payment_method?: string | null
                    payment_status?: string | null
                    avatar_emoji?: string | null
                    manager_name?: string | null
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
                    client_id?: string | null
                    client_name?: string | null
                    value?: number | null
                    services?: Json | null
                    billing_type?: "pontual" | "recorrente" | null
                    service_type?: string | null
                    contract_status?: "active" | "expired" | "pending" | null
                    next_billing_date?: string | null
                    billing_cycle?: string | null
                    advance_payment?: number | null
                    payment_method?: string | null
                    payment_status?: string | null
                    avatar_emoji?: string | null
                    manager_name?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "projects_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    }
                ]
            }
            clients: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    company_name: string | null
                    email: string | null
                    phone: string | null
                    city: string | null
                    business_type: string | null
                    user_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    company_name?: string | null
                    email?: string | null
                    phone?: string | null
                    city?: string | null
                    business_type?: string | null
                    user_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    company_name?: string | null
                    email?: string | null
                    phone?: string | null
                    city?: string | null
                    business_type?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            leads: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    name: string
                    company_name: string | null
                    email: string | null
                    phone: string | null
                    website: string | null
                    status: "novo" | "contato" | "proposta" | "negociacao" | "fechado" | "perdido"
                    source: string | null
                    notes: string | null
                    score: number
                    potential_value: number | null
                    is_hot: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    name: string
                    company_name?: string | null
                    email?: string | null
                    phone?: string | null
                    website?: string | null
                    status?: "novo" | "contato" | "proposta" | "negociacao" | "fechado" | "perdido"
                    source?: string | null
                    notes?: string | null
                    score?: number
                    potential_value?: number | null
                    is_hot?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    name?: string
                    company_name?: string | null
                    email?: string | null
                    phone?: string | null
                    website?: string | null
                    status?: "novo" | "contato" | "proposta" | "negociacao" | "fechado" | "perdido"
                    source?: string | null
                    notes?: string | null
                    score?: number
                    potential_value?: number | null
                    is_hot?: boolean
                }
                Relationships: [
                    {
                        foreignKeyName: "leads_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            kanban_scenarios: {
                Row: {
                    created_at: string
                    id: string
                    position: number
                    project_id: string
                    title: string
                    type: "kanban" | "checklist"
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    position?: number
                    project_id: string
                    title: string
                    type: "kanban" | "checklist"
                    user_id?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    position?: number
                    project_id?: string
                    title?: string
                    type?: "kanban" | "checklist"
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "kanban_scenarios_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            kanban_columns: {
                Row: {
                    color: string | null
                    created_at: string
                    hint: string | null
                    id: string
                    position: number
                    project_id: string | null
                    scenario_id: string | null
                    title: string
                    user_id: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    hint?: string | null
                    id?: string
                    position?: number
                    project_id?: string | null
                    scenario_id?: string | null
                    title: string
                    user_id: string
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    hint?: string | null
                    id?: string
                    position?: number
                    project_id?: string | null
                    scenario_id?: string | null
                    title?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "kanban_columns_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "kanban_columns_scenario_id_fkey"
                        columns: ["scenario_id"]
                        isOneToOne: false
                        referencedRelation: "kanban_scenarios"
                        referencedColumns: ["id"]
                    }
                ]
            }
            inbox: {
                Row: {
                    category: string | null
                    content: string
                    created_at: string
                    id: string
                    project_id: string | null
                    tags: string[] | null
                    title: string | null
                    type: string | null
                    user_id: string
                }
                Insert: {
                    category?: string | null
                    content: string
                    created_at?: string
                    id?: string
                    project_id?: string | null
                    tags?: string[] | null
                    title?: string | null
                    type?: string | null
                    user_id: string
                }
                Update: {
                    category?: string | null
                    content?: string
                    created_at?: string
                    id?: string
                    project_id?: string | null
                    tags?: string[] | null
                    title?: string | null
                    type?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "inbox_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
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
                    billing_period: string | null
                    start_time: string | null
                    end_time: string | null
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
                    billing_period?: string | null
                    start_time?: string | null
                    end_time?: string | null
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
                    billing_period?: string | null
                    start_time?: string | null
                    end_time?: string | null
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
            project_costs: {
                Row: {
                    amount: number
                    category: string
                    created_at: string
                    date: string
                    id: string
                    project_id: string | null
                    title: string
                    user_id: string
                }
                Insert: {
                    amount: number
                    category: string
                    created_at?: string
                    date: string
                    id?: string
                    project_id?: string | null
                    title: string
                    user_id: string
                }
                Update: {
                    amount?: number
                    category?: string
                    created_at?: string
                    date?: string
                    id?: string
                    project_id?: string | null
                    title?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_costs_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            project_documents: {
                Row: {
                    category: string
                    created_at: string
                    file_url: string
                    id: string
                    name: string
                    project_id: string
                    user_id: string
                }
                Insert: {
                    category: string
                    created_at?: string
                    file_url: string
                    id?: string
                    name: string
                    project_id: string
                    user_id: string
                }
                Update: {
                    category?: string
                    created_at?: string
                    file_url?: string
                    id?: string
                    name?: string
                    project_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_documents_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            company_info: {
                Row: {
                    id: string
                    user_id: string
                    company_name: string | null
                    trading_name: string | null
                    cnpj: string | null
                    email: string | null
                    phone: string | null
                    address: string | null
                    pix_key: string | null
                    logo_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    company_name?: string | null
                    trading_name?: string | null
                    cnpj?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    pix_key?: string | null
                    logo_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    company_name?: string | null
                    trading_name?: string | null
                    cnpj?: string | null
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    pix_key?: string | null
                    logo_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            company_documents: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    category: string
                    file_url: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    category: string
                    file_url: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    category?: string
                    file_url?: string
                    created_at?: string
                }
                Relationships: []
            }
            invoice_history: {
                Row: {
                    id: string
                    user_id: string
                    month_year: string
                    invoice_count: number
                    total_amount: number
                    taxes_amount: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    month_year: string
                    invoice_count?: number
                    total_amount?: number
                    taxes_amount?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    month_year?: string
                    invoice_count?: number
                    total_amount?: number
                    taxes_amount?: number
                    created_at?: string
                }
                Relationships: []
            }
            document_templates: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    content: string
                    type: string
                    is_default: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    content: string
                    type: string
                    is_default?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    content?: string
                    type?: string
                    is_default?: boolean
                    created_at?: string
                }
                Relationships: []
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
