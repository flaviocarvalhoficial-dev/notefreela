import { useState } from "react";
import { Plus, Trash2, Briefcase, Globe, LayoutGrid, Smartphone, Video, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServiceTypes } from "@/hooks/use-service-types";
import { useToast } from "@/hooks/use-toast";

const ICON_OPTIONS = [
    { name: "Briefcase", icon: Briefcase },
    { name: "Globe", icon: Globe },
    { name: "LayoutGrid", icon: LayoutGrid },
    { name: "Smartphone", icon: Smartphone },
    { name: "Video", icon: Video },
    { name: "Sparkles", icon: Sparkles },
];

export const ServiceTypeManager = () => {
    const { serviceTypes, isLoading, createServiceType, isCreating } = useServiceTypes();
    const [newService, setNewService] = useState({ label: "", name: "" });
    const { toast } = useToast();

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newService.label) return;

        const name = newService.name || newService.label.toLowerCase().replace(/\s+/g, '_');

        try {
            await createServiceType({
                label: newService.label,
                name: name,
                icon: "Briefcase",
                color: null
            });
            setNewService({ label: "", name: "" });
            toast({
                title: "Serviço adicionado",
                description: "O novo tipo de serviço foi salvo."
            });
        } catch (error) {
            toast({
                title: "Erro ao adicionar",
                description: "Não foi possível salvar o serviço.",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium tracking-tight mb-1">Tipos de Serviço</h3>
                <p className="text-sm text-muted-foreground font-normal">Gerencie os serviços que você oferece aos seus clientes.</p>
            </div>

            <form onSubmit={handleAdd} className="flex gap-3">
                <div className="flex-1 space-y-2">
                    <Input
                        placeholder="Nome do serviço (ex: Landing Page)"
                        value={newService.label}
                        onChange={(e) => setNewService({ ...newService, label: e.target.value })}
                        className="bg-muted/5 border-border"
                    />
                </div>
                <Button type="submit" disabled={isCreating || !newService.label} className="gap-2">
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Adicionar
                </Button>
            </form>

            <div className="grid gap-3">
                {serviceTypes.map((service) => (
                    <div key={service.id || service.name} className="flex items-center justify-between p-4 bg-muted/5 rounded-md border border-border group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Briefcase className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium tracking-tight">{service.label}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">{service.name}</p>
                            </div>
                        </div>

                        {!service.is_default && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        {service.is_default && (
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-2">Padrão</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
