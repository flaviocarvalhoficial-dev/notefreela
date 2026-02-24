
import { useState } from "react";
import { Loader2, Plus, Building2, MapPin, Briefcase, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

export function NewClientDialog({ trigger, client }: { trigger?: React.ReactNode; client?: any }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: client?.name || "",
        companyName: client?.company_name || "",
        email: client?.email || "",
        phone: client?.phone || "",
        city: client?.city || "",
        businessType: client?.business_type || "",
    });
    const [selectedProject, setSelectedProject] = useState<string>("");

    const { data: projects = [] } = useQuery({
        queryKey: ["projects-list"],
        queryFn: async () => {
            const { data } = await supabase.from("projects").select("id, name, client_id");
            return data || [];
        },
        enabled: open // Only fetch when dialog is open
    });

    const createClientMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data: newClient, error } = await (supabase as any).from("clients").insert({
                user_id: user.id,
                name: formData.name,
                company_name: formData.companyName,
                email: formData.email,
                phone: formData.phone,
                city: formData.city,
                business_type: formData.businessType,
            }).select().single();

            if (error) throw error;

            // Update linked project if selected
            if (selectedProject && newClient) {
                const { error: projectError } = await (supabase as any)
                    .from("projects")
                    .update({
                        client_id: newClient.id,
                        client_name: newClient.name // Sync name too
                    })
                    .eq("id", selectedProject);

                if (projectError) console.error("Error linking project:", projectError);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["projects-index"] }); // Refresh projects too
            toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
            setOpen(false);
            setFormData({ name: "", companyName: "", email: "", phone: "", city: "", businessType: "" });
            setSelectedProject("");
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const updateClientMutation = useMutation({
        mutationFn: async () => {
            const { error } = await (supabase as any)
                .from("clients")
                .update({
                    name: formData.name,
                    company_name: formData.companyName,
                    email: formData.email,
                    phone: formData.phone,
                    city: formData.city,
                    business_type: formData.businessType,
                })
                .eq("id", client.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast({ title: "Sucesso", description: "Cliente atualizado com sucesso!" });
            setOpen(false);
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (client) {
            updateClientMutation.mutate();
        } else {
            createClientMutation.mutate();
        }
    };

    const isLoading = createClientMutation.isPending || updateClientMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="btn-gradient">
                        <Plus className="h-4 w-4 mr-2" /> Novo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="border-border max-w-lg">
                <DialogHeader>
                    <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Contato</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ex: Ana Silva"
                                    className="pl-9 glass-light text-foreground"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Empresa</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ex: Tech Solutions"
                                    className="pl-9 glass-light text-foreground"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange("companyName", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="contato@empresa.com"
                                    className="pl-9 glass-light text-foreground"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="(00) 00000-0000"
                                    className="pl-9 glass-light text-foreground"
                                    value={formData.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cidade</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="São Paulo, SP"
                                    className="pl-9 glass-light text-foreground"
                                    value={formData.city}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Ramo de Negócio</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ex: Tecnologia"
                                    className="pl-9 glass-light text-foreground"
                                    value={formData.businessType}
                                    onChange={(e) => handleChange("businessType", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Vincular Projeto Existente (Opcional)</Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject} disabled={!!client}>
                            <SelectTrigger className="glass-light">
                                <SelectValue placeholder="Selecione um projeto para vincular..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project: any) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name} {project.client_id ? "(Já vinculado)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!!client && <p className="text-[10px] text-muted-foreground">Vínculo de projetos disponível apenas na criação.</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button
                            className="btn-gradient"
                            disabled={isLoading || !formData.name}
                            onClick={handleSave}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (client ? "Salvar Alterações" : "Salvar Cliente")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


