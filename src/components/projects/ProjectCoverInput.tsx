import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

interface ProjectCoverInputProps {
    value: string;
    onChange: (url: string) => void;
}

export function ProjectCoverInput({ value, onChange }: ProjectCoverInputProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Arquivo inválido",
                description: "Por favor, selecione uma imagem.",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${user.id}/project-cover-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('business-assets')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('business-assets')
                .getPublicUrl(fileName);

            onChange(publicUrl);
            toast({
                title: "Imagem enviada",
                description: "A capa do projeto foi atualizada.",
            });
        } catch (error: any) {
            toast({
                title: "Erro no upload",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    handleUpload(file);
                    // Prevenir o comportamento padrão de colar texto se for uma imagem
                    e.preventDefault();
                    return;
                }
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="relative group">
                <Input
                    placeholder="Cole o link ou uma imagem (Ctrl+V) aqui..."
                    className="glass-light border-border h-10 pl-9 pr-12 text-xs focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onPaste={handlePaste}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                </div>

                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/40 hover:text-foreground hover:bg-primary/5 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        title="Upload de imagem"
                    >
                        <Upload className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                }}
            />

            <p className="text-[10px] text-muted-foreground/60 px-1 italic">
                Aceita links diretos, upload de arquivos ou colar imagem.
            </p>
        </div>
    );
}
