import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: string;
    onConfirm: (name: string, url: string | null) => void;
}

export function AddDocumentDialog({
    open,
    onOpenChange,
    category,
    onConfirm,
}: AddDocumentDialogProps) {
    const [name, setName] = useState(category.toUpperCase());
    const [url, setUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onConfirm(name, url || null);
            onOpenChange(false);
            setName(category.toUpperCase());
            setUrl("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="notion-card max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Anexar {category.toUpperCase()}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            Nome do Arquivo
                        </Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                            placeholder="Ex: Contrato assinado"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            URL do Arquivo (Opcional)
                        </Label>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                            placeholder="https://..."
                        />
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-md font-bold text-xs uppercase tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="rounded-md font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground"
                        >
                            Anexar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
