import { supabase } from "@/integrations/supabase";

export type ActivityType = "project" | "task" | "comment" | "status" | "assignment" | "inbox";

interface ActivityParams {
    title: string;
    description?: string;
    type: ActivityType;
    metadata?: Record<string, any>;
    projectId?: string;
}

export async function logActivity({ title, description, type, metadata = {}, projectId }: ActivityParams) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("activities").insert({
            title,
            description,
            type: type as any,
            metadata,
            user_id: user.id,
            // @ts-ignore
            project_id: projectId
        });

        if (error) {
            console.error("Error logging activity:", error);
        }
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
}
