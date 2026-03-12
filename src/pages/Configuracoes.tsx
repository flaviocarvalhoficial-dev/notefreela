import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    User,
    Bell,
    Shield,
    Palette,
    Globe,
    CreditCard,
    LogOut,
    Save,
    Camera,
    Loader2,
    Check
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase";

export default function Configuracoes() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<Partial<Tables<"profiles">>>({
        full_name: "",
        avatar_url: ""
    });
    const { toast } = useToast();

    useEffect(() => {
        async function getProfile() {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                const { data, error } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (data) {
                    setProfile({
                        full_name: data.full_name || "",
                        avatar_url: data.avatar_url || ""
                    });
                }
            }
            setIsLoading(false);
        }
        getProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: profile.full_name,
                    updated_at: new Date().toISOString()
                })
                .eq("id", user.id);

            if (error) throw error;

            toast({
                title: "Perfil atualizado",
                description: "Suas alterações foram salvas com sucesso.",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar perfil";
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage (Assumes 'avatars' bucket is public)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update Profile Table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, avatar_url: publicUrl });
            toast({ title: "Sucesso!", description: "Foto de perfil atualizada." });
        } catch (error: unknown) {
            toast({
                title: "Erro no upload",
                description: "Verifique se o bucket 'avatars' existe e é público no Supabase.",
                variant: "destructive",
            });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="max-w-4xl w-full mx-auto">
                <header className="flex items-center justify-between gap-4 mb-8 h-12">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight text-foreground">Configurações</h1>
                    </div>
                </header>

                <div className="mt-8">

                    <Tabs defaultValue="perfil" className="space-y-6">
                        <TabsList className="bg-card border border-border p-1 rounded-md">
                            <TabsTrigger value="perfil" className="gap-2 rounded-md font-medium text-xs">
                                <User className="h-4 w-4" /> Perfil
                            </TabsTrigger>
                            <TabsTrigger value="notificacoes" className="gap-2 rounded-md font-medium text-xs">
                                <Bell className="h-4 w-4" /> Notificações
                            </TabsTrigger>
                            <TabsTrigger value="seguranca" className="gap-2 rounded-md font-medium text-xs">
                                <Shield className="h-4 w-4" /> Segurança
                            </TabsTrigger>
                            <TabsTrigger value="aparencia" className="gap-2 rounded-md font-medium text-xs">
                                <Palette className="h-4 w-4" /> Aparência
                            </TabsTrigger>
                            <TabsTrigger value="plano" className="gap-2 rounded-md font-medium text-xs text-primary">
                                <CreditCard className="h-4 w-4" /> Plano
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="perfil">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bento-card p-6"
                            >
                                <form onSubmit={handleUpdateProfile} className="space-y-8">
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="relative group">
                                            <Avatar className="h-24 w-24 border border-border shadow-sm overflow-hidden rounded-full">
                                                <AvatarImage src={profile.avatar_url} className="object-cover" />
                                                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-medium ">
                                                    {profile.full_name?.[0] || user?.email?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <label
                                                htmlFor="avatar-upload"
                                                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                            >
                                                <Camera className="h-4 w-4" />
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleUpload}
                                                    disabled={isSaving}
                                                />
                                            </label>
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h3 className="text-lg font-medium tracking-tight">Foto de Perfil</h3>
                                            <p className="text-xs text-muted-foreground mb-3 font-normal">JPG, GIF ou PNG. Tamanho máximo de 2MB.</p>
                                            <div className="flex gap-2 justify-center sm:justify-start">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-muted/5 border-border rounded-md font-medium"
                                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                                    type="button"
                                                >
                                                    {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                                                    Alterar
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive font-medium rounded-md">Remover</Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground  tracking-tight">Nome Completo</Label>
                                            <Input
                                                id="name"
                                                value={profile.full_name}
                                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                placeholder="Seu nome"
                                                className="bg-muted/5 border-border rounded-md h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground  tracking-tight">E-mail</Label>
                                            <Input
                                                id="email"
                                                value={user?.email || ""}
                                                disabled
                                                className="bg-muted/10 border-border rounded-md h-11 opacity-60 font-medium tracking-tight"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                            className="border-primary transition-all active:scale-95 gap-2 font-medium rounded-md shadow-sm"
                                        >
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="notificacoes">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-sm"
                            >
                                <div>
                                    <h3 className="text-lg font-medium tracking-tight mb-1">Preferências de Notificação</h3>
                                    <p className="text-sm text-muted-foreground font-normal">Escolha como você quer ser notificado sobre suas atividades.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { title: "E-mail de Próximos Eventos", desc: "Receba um resumo diário da sua agenda por e-mail." },
                                        { title: "Notificações na Web", desc: "Alertas em tempo real enquanto você usa o app." },
                                        { title: "Atualizações de Projetos", desc: "Seja notificado quando um projeto mudar de status." },
                                        { title: "Novas Mensagens", desc: "Receba alertas instantâneos de novas conversas no chat." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-muted/5 rounded-md border border-border">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium tracking-tight">{item.title}</p>
                                                <p className="text-[11px] text-muted-foreground font-normal">{item.desc}</p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="seguranca">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-sm"
                            >
                                <div>
                                    <h3 className="text-lg font-medium tracking-tight mb-1">Autenticação e Acesso</h3>
                                    <p className="text-sm text-muted-foreground font-normal">Mantenha sua conta protegida com as melhores práticas de segurança.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/5 rounded-md border border-border flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium tracking-tight">Alterar Senha</p>
                                            <p className="text-[11px] text-muted-foreground font-normal">Última alteração há 3 meses.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="bg-muted/10 border-border rounded-md font-medium text-xs h-8">Atualizar</Button>
                                    </div>

                                    <div className="p-4 bg-muted/5 rounded-md border border-border flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium tracking-tight">Autenticação de Dois Fatores (2FA)</p>
                                            <p className="text-[11px] text-primary/60 font-medium">Recomendado para maior segurança.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 text-primary rounded-md font-medium text-xs h-8">Ativar</Button>
                                    </div>
                                </div>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="aparencia">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-lg p-6 space-y-6 shadow-sm"
                            >
                                <div>
                                    <h3 className="text-lg font-medium tracking-tight mb-1">Personalização</h3>
                                    <p className="text-sm text-muted-foreground font-normal">Ajuste o visual do Nimbus ao seu gosto.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-6 bg-primary/5 rounded-lg border border-primary/30 relative cursor-pointer group">
                                        <div className="w-full aspect-video bg-neutral-950 rounded-md mb-3 border border-border overflow-hidden shadow-inner">
                                            <div className="w-1/3 h-full bg-neutral-900 border-r border-border p-2 space-y-1">
                                                <div className="h-1 w-full bg-primary/20 rounded-full" />
                                                <div className="h-1 w-2/3 bg-muted/20 rounded-full" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-center  tracking-tight text-foreground">Dark Mode (Padrão)</p>
                                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-0.5">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-card rounded-lg border border-border hover:border-border transition-all cursor-pointer group">
                                        <div className="w-full aspect-video bg-white rounded-md mb-3 border border-border shadow-inner overflow-hidden">
                                            <div className="w-1/3 h-full bg-slate-50 border-r border-border p-2 space-y-1">
                                                <div className="h-1 w-full bg-primary/20 rounded-full" />
                                                <div className="h-1 w-2/3 bg-muted/20 rounded-full" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-center  tracking-tight text-muted-foreground">Light Mode</p>
                                    </div>
                                </div>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="plano">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-lg p-8 text-center space-y-6 shadow-sm"
                            >
                                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto border border-primary/10">
                                    <CreditCard className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2 font-medium  text-[10px] tracking-tight">Plano Atual: Free Beta</Badge>
                                    <h3 className="text-2xl font-medium tracking-tight">Nimbus Pro</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 font-normal leading-relaxed">
                                        Acesso ilimitado a projetos, relatórios avançados e integração total com o calendário.
                                    </p>
                                </div>

                                <div className="grid gap-3 pt-4">
                                    <Button className="w-full border-primary transition-all active:scale-95 h-12 text-sm font-medium rounded-md shadow-sm">
                                        Fazer Upgrade por R$ 29,90 / mês
                                    </Button>
                                    <Button variant="ghost" className="text-muted-foreground text-[10px]  font-medium tracking-tight hover:text-foreground">
                                        Gerenciar faturamento
                                    </Button>
                                </div>
                            </motion.div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-center pt-8">
                        <Button
                            variant="outline"
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = "/auth";
                            }}
                            className="text-destructive border-destructive/20 hover:bg-destructive/5 gap-2 px-8 py-5 rounded-md text-sm font-medium"
                        >
                            <LogOut className="h-4 w-4" /> Finalizar Sessão
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}



