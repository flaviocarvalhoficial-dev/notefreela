import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableTaskCard, type EditTaskValues } from "@/components/tasks/EditableTaskCard";
import { Task } from "@/types/kanban";

interface SortableTaskItemProps {
    task: Task;
    color?: string;
    isEditing: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSave: (values: EditTaskValues) => void;
    onDelete?: () => void;
    projects?: { id: string; name: string }[];
    variant?: 'card' | 'minimal';
}

export function SortableTaskItem({
    task,
    color,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onSave,
    onDelete,
    projects,
    variant = 'card',
}: SortableTaskItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { columnId: task.column_id },
        disabled: isEditing,
    });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    // Adapter for the component which expects "project" as string and "columnId"
    const taskAdapter = {
        ...task,
        project: task.project_name || "Geral",
        columnId: task.column_id,
        due: task.due_date || undefined,
        projectId: task.project_id || undefined
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? "opacity-40" : "opacity-100"}
            {...(!isEditing ? attributes : {})}
            {...(!isEditing ? listeners : {})}
        >
            <EditableTaskCard
                task={taskAdapter as any}
                isEditing={isEditing}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSave={onSave}
                onDelete={onDelete}
                accentColor={color}
                projects={projects}
                variant={variant}
            />
        </div>
    );
}
