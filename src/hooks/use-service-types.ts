import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

export type ServiceType = {
    id: string;
    created_at: string;
    user_id: string;
    name: string;
    label: string;
    icon: string | null;
    color: string | null;
    is_default: boolean;
};

const DEFAULT_SERVICES: Partial<ServiceType>[] = [
    { name: "social_media", label: "Social Media", icon: "Briefcase" },
    { name: "web_site", label: "Web site", icon: "Globe" },
    { name: "app_web", label: "App web", icon: "LayoutGrid" },
    { name: "app_mobile", label: "App mobile", icon: "Smartphone" },
    { name: "video", label: "Video", icon: "Video" },
    { name: "fotografia_ia", label: "Ensaio de fotografia com IA", icon: "Sparkles" }
];

export const useServiceTypes = () => {
    const queryClient = useQueryClient();

    const { data: serviceTypes = [], isLoading } = useQuery({
        queryKey: ["service-types"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("service_types")
                .select("*")
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching service types:", error);
                // Return defaults if table doesn't exist yet or other error
                return DEFAULT_SERVICES as ServiceType[];
            }

            if (data.length === 0) {
                return DEFAULT_SERVICES as ServiceType[];
            }

            return data as ServiceType[];
        },
    });

    const createServiceType = useMutation({
        mutationFn: async (newService: Omit<ServiceType, "id" | "created_at" | "user_id" | "is_default">) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("service_types")
                .insert([{
                    ...newService,
                    user_id: user.id,
                    is_default: false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["service-types"] });
        },
    });

    return {
        serviceTypes,
        isLoading,
        createServiceType: createServiceType.mutateAsync,
        isCreating: createServiceType.isPending
    };
};
