
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

export interface CompanyInfo {
    id?: string;
    company_name: string;
    trading_name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    pix_key: string;
    logo_url?: string;
    stationery_url?: string;
}

export function useCompanyData() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch Company Info
    const { data: companyInfo, isLoading: isLoadingInfo } = useQuery({
        queryKey: ["company-info"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from("company_info")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data as CompanyInfo | null;
        },
    });

    // 2. Upsert Company Info
    const updateInfoMutation = useMutation({
        mutationFn: async (info: Partial<CompanyInfo>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("company_info")
                .upsert({
                    ...info,
                    user_id: user.id,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company-info"] });
            toast({
                title: "Sucesso",
                description: "Dados da empresa atualizados.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao salvar",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // 3. Fetch Documents
    const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
        queryKey: ["company-documents"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("company_documents")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });

    // 4. Fetch Invoices
    const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
        queryKey: ["invoice-history"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("invoice_history")
                .select("*")
                .eq("user_id", user.id)
                .order("month_year", { ascending: false });

            if (error) throw error;
            return data || [];
        },
    });

    // 5. Fetch Templates
    const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
        queryKey: ["document-templates"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("document_templates")
                .select("*")
                .eq("user_id", user.id)
                .order("title", { ascending: true });

            if (error) throw error;
            return data || [];
        },
    });

    // 6. Upload Document
    const uploadDocumentMutation = useMutation({
        mutationFn: async ({ file, name, category }: { file: File, name: string, category: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('business-assets')
                .getPublicUrl(fileName);

            const { data, error: dbError } = await supabase
                .from("company_documents")
                .insert({
                    user_id: user.id,
                    name,
                    category,
                    file_url: publicUrl,
                })
                .select()
                .single();

            if (dbError) throw dbError;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company-documents"] });
            toast({ title: "Documento enviado", description: "O arquivo foi armazenado com sucesso." });
        },
        onError: (error: any) => {
            toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
        }
    });

    // 7. Add Manual Invoice
    const addInvoiceMutation = useMutation({
        mutationFn: async (invoice: { month_year: string, invoice_count: number, total_amount: number, taxes_amount: number }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("invoice_history")
                .insert({
                    ...invoice,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoice-history"] });
            toast({ title: "Registro salvo", description: "O faturamento manual foi registrado." });
        },
        onError: (error: any) => {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        }
    });

    // 7.5. Update Document Metadata
    const updateDocumentMutation = useMutation({
        mutationFn: async ({ id, name, category }: { id: string, name: string, category: string }) => {
            const { error } = await supabase
                .from("company_documents")
                .update({ name, category })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company-documents"] });
            toast({ title: "Documento atualizado" });
        },
        onError: (error: any) => {
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        }
    });

    // 8. Delete Document
    const deleteDocumentMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("company_documents")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company-documents"] });
            toast({ title: "Documento removido" });
        },
    });

    // 9. Upsert Template
    const upsertTemplateMutation = useMutation({
        mutationFn: async (template: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("document_templates")
                .upsert({
                    ...template,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["document-templates"] });
            toast({ title: "Modelo salvo com sucesso" });
        },
    });

    // 10. Update Logo
    const updateLogoMutation = useMutation({
        mutationFn: async (file: File) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('business-assets')
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from("company_info")
                .upsert({
                    user_id: user.id,
                    logo_url: publicUrl,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (dbError) throw dbError;
            return publicUrl;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company-info"] });
            toast({ title: "Logotipo atualizado" });
        },
    });

    // 10. Update Stationery Template Image
    const updateStationeryMutation = useMutation({
        mutationFn: async (file: File) => {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) throw new Error("Usuário não autenticado");

            const fileName = `stationery_${user.user.id}_${Date.now()}`;
            const { data, error: uploadError } = await supabase.storage
                .from("business-assets")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("business-assets")
                .getPublicUrl(data.path);

            const { error: dbError } = await supabase
                .from("company_info")
                .upsert({
                    user_id: user.user.id,
                    stationery_url: publicUrl,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (dbError) throw dbError;
            return publicUrl;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["company-info"] });
            toast({ title: "Papelaria atualizada com sucesso!" });
        },
        onError: (error: any) => {
            toast({ title: "Erro no upload da papelaria", description: error.message, variant: "destructive" });
        }
    });

    return {
        companyInfo,
        documents,
        invoices,
        templates,
        isLoading: isLoadingInfo || isLoadingDocs || isLoadingInvoices || isLoadingTemplates,
        updateInfo: updateInfoMutation.mutate,
        isUpdating: updateInfoMutation.isPending,
        uploadDocument: uploadDocumentMutation.mutate,
        isUploading: uploadDocumentMutation.isPending,
        updateDocument: updateDocumentMutation.mutate,
        deleteDocument: deleteDocumentMutation.mutate,
        addInvoice: addInvoiceMutation.mutate,
        isAddingInvoice: addInvoiceMutation.isPending,
        upsertTemplate: upsertTemplateMutation.mutate,
        updateLogo: updateLogoMutation.mutate,
        isUpdatingLogo: updateLogoMutation.isPending,
        updateStationery: updateStationeryMutation.mutate,
        isUpdatingStationery: updateStationeryMutation.isPending,
    };
}
