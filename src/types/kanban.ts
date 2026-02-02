export type Priority = "low" | "medium" | "high";

export interface TaskTag {
    id: string;
    name: string;
    color: string;
}

export type ColumnId = string;

export interface Task {
    id: string;
    title: string;
    project_id: string | null;
    project_name?: string;
    priority: Priority;
    due_date?: string | null;
    progress: number;
    column_id: ColumnId;
    assignee?: string | null;
    tags?: TaskTag[];
}

export interface Column {
    id: ColumnId;
    title: string;
    hint: string;
    color?: string;
    scenario_id?: string;
    position?: number;
    project_id?: string | null;
    user_id?: string;
}

export interface Scenario {
    id: string;
    title: string;
    type: 'kanban' | 'checklist';
    position: number;
    project_id: string | null;
}
