import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { toast } from "@/hooks/use-toast";

// --- TYPES ---

export interface HabitCategory {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
}

export interface Habit {
    id: string;
    category_id: string | null;
    category: string | null;
    title: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    target_days: number;
    metadata?: {
        time?: string;
        shift?: string;
        distance?: string;
        goal?: string;
        unit?: string;
        is_running?: boolean;
    };
    created_at: string;
    // Computed
    completed_today?: boolean;
    streak?: number;
    progress?: number;
}

export interface Credential {
    id: string;
    service_name: string;
    login_user: string | null;
    login_password: string | null;
    url: string | null;
    category: string | null;
    notes: string | null;
    created_at: string;
}

export interface PersonalCourse {
    id: string;
    title: string;
    platform: string | null;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percent: number;
    url: string | null;
    created_at: string;
}

// --- HABITS HOOKS ---

export function useHabits() {
    return useQuery({
        queryKey: ["habits"],
        queryFn: async () => {
            const { data: categories } = await supabase.from("habit_categories" as any).select("*");
            const { data: habits } = await supabase.from("habits" as any).select("*");

            // Get logs for the last 30 days to calculate progress
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const today = new Date().toISOString().split('T')[0];

            const { data: logs } = await supabase
                .from("habit_logs" as any)
                .select("*")
                .gte("completed_at", thirtyDaysAgo.toISOString().split('T')[0]);

            const habitLogsList = (logs as any[]) || [];

            return {
                categories: (categories as any[]) || [],
                habits: ((habits as any[]) || []).map(h => {
                    const habitLogs = habitLogsList.filter(l => l.habit_id === h.id);
                    const completedToday = habitLogs.some(l => l.completed_at === today);

                    let progress = 0;
                    if (h.frequency === 'daily') {
                        progress = Math.round((habitLogs.length / 30) * 100);
                    } else if (h.frequency === 'weekly') {
                        progress = Math.round((habitLogs.length / 4) * 100);
                    } else {
                        progress = habitLogs.length > 0 ? 100 : 0;
                    }

                    return {
                        ...h,
                        completed_today: completedToday,
                        progress: Math.min(progress, 100)
                    };
                }) as Habit[]
            };
        }
    });
}

export function useToggleHabit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ habitId, completed }: { habitId: string, completed: boolean }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const today = new Date().toISOString().split('T')[0];

            if (completed) {
                const { error } = await supabase
                    .from("habit_logs" as any)
                    .insert({ habit_id: habitId, user_id: user.id, completed_at: today });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("habit_logs" as any)
                    .delete()
                    .eq("habit_id", habitId)
                    .eq("completed_at", today);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] });
        }
    });
}

export function useCreateHabit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (habit: Partial<Habit>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { error } = await supabase
                .from("habits" as any)
                .insert({ ...habit, user_id: user.id });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] });
            toast({ title: "Hábito criado!", description: "Continue focado!" });
        }
    });
}

export function useDeleteHabit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("habits" as any)
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] });
            toast({ title: "Hábito removido" });
        }
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (category: Partial<HabitCategory>) => {
            const { id, ...data } = category;
            const { error } = await supabase
                .from("habit_categories" as any)
                .update(data)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] });
            toast({ title: "Categoria atualizada!" });
        }
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (category: Partial<HabitCategory>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { data, error } = await supabase
                .from("habit_categories" as any)
                .insert({ ...category, user_id: user.id })
                .select()
                .single();
            if (error) throw error;
            return data as any as HabitCategory;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["habits"] });
        }
    });
}

// --- COURSES HOOKS ---

export function usePersonalCourses() {
    return useQuery<PersonalCourse[]>({
        queryKey: ["personal-courses"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("personal_courses" as any)
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data as any[] || []) as PersonalCourse[];
        }
    });
}

export function useUpsertCourse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (course: Partial<PersonalCourse>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { id, ...dataWithoutId } = course;

            if (id) {
                const { error } = await supabase
                    .from("personal_courses" as any)
                    .update({ ...dataWithoutId, user_id: user.id })
                    .eq("id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("personal_courses" as any)
                    .insert({ ...dataWithoutId, user_id: user.id });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personal-courses"] });
            toast({ title: "Curso atualizado!" });
        }
    });
}

export function useDeleteCourse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("personal_courses" as any)
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personal-courses"] });
            toast({ title: "Curso removido" });
        }
    });
}

// --- CREDENTIALS HOOKS ---

export function useCredentials() {
    return useQuery<Credential[]>({
        queryKey: ["personal-credentials"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("personal_credentials" as any)
                .select("*")
                .order("service_name");
            if (error) throw error;
            return (data as any[] || []) as Credential[];
        }
    });
}

export function useUpsertCredential() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (cred: Partial<Credential>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { id, ...dataWithoutId } = cred;

            if (id) {
                const { error } = await supabase
                    .from("personal_credentials" as any)
                    .update({ ...dataWithoutId, user_id: user.id })
                    .eq("id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("personal_credentials" as any)
                    .insert({ ...dataWithoutId, user_id: user.id });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personal-credentials"] });
            toast({ title: "Acesso salvo com sucesso!" });
        }
    });
}

export function useDeleteCredential() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("personal_credentials" as any)
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personal-credentials"] });
            toast({ title: "Acesso removido" });
        }
    });
}
