import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, Loader2 } from "lucide-react";

interface NewDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projects: any[];
    onUpload: (data: { file: File, name: string, category: string, projectId: string }) => void;
    isUploading: boolean;
}

export function NewDocumentDialog({ open, onOpenChange, projects, onUpload, isUploading }: NewDocumentDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Outros");
    const [projectId, setProjectId] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !name || !projectId) return;

        onUpload({ file, name, category, projectId });
        setName("");
        setFile(null);
        setProjectId("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-border/40 shadow-glass">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Novo Documento</DialogTitle>
                    <DialogDescription>Suba um arquivo e vincule a um projeto.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Arquivo</Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById("file-upload")?.click()}
                                    className="w-full glass-light border-dashed border-2 h-20 flex flex-col gap-2"
                                >
                                    <FileUp className="h-5 w-5 text-primary/40" />
                                    <span className="text-xs">{file ? file.name : "Clique para selecionar"}</span>
                                </Button>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                            setFile(f);
                                            if (!name) setName(f.name.split('.')[0]);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Nome do Documento</Label>
                            <Input
                                id="title"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Contrato de Design"
                                className="glass-light"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Categoria</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="glass-light">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Contrato">Contrato</SelectItem>
                                        <SelectItem value="Briefing">Briefing</SelectItem>
                                        <SelectItem value="Recibo">Recibo</SelectItem>
                                        <SelectItem value="Proposta">Proposta</SelectItem>
                                        <SelectItem value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Projeto</Label>
                                <Select value={projectId} onValueChange={setProjectId} required>
                                    <SelectTrigger className="glass-light">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isUploading || !file || !projectId}
                            className="w-full bg-gradient-to-r from-primary to-accent font-bold"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Documento"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
