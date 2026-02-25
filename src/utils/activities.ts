import { supabase } from "@/integrations/supabase";

export type ActivityType = "project" | "task" | "comment" | "status" | "assignment";

interface ActivityParams {
    title: string;
    description?: string;
    type: ActivityType;
    metadata?: Record<string, any>;
}

export async function logActivity({ title, description, type, metadata = {} }: ActivityParams) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("activities").insert({
            title,
            description,
            type,
            metadata: {
                ...metadata,
                user_id: user.id,
            },
            user_id: user.id,
        });

        if (error) {
            console.error("Error logging activity:", error);
        }
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
}
