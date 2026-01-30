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
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({
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
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message,
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
        } catch (error: any) {
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-1">Configurações</h1>
                <p className="text-muted-foreground text-sm">Gerencie sua conta, preferências e segurança</p>
            </div>

            <Tabs defaultValue="perfil" className="space-y-6">
                <TabsList className="glass-light border border-border/50 p-1 rounded-xl">
                    <TabsTrigger value="perfil" className="gap-2 rounded-lg">
                        <User className="h-4 w-4" /> Perfil
                    </TabsTrigger>
                    <TabsTrigger value="notificacoes" className="gap-2 rounded-lg">
                        <Bell className="h-4 w-4" /> Notificações
                    </TabsTrigger>
                    <TabsTrigger value="seguranca" className="gap-2 rounded-lg">
                        <Shield className="h-4 w-4" /> Segurança
                    </TabsTrigger>
                    <TabsTrigger value="aparencia" className="gap-2 rounded-lg">
                        <Palette className="h-4 w-4" /> Aparência
                    </TabsTrigger>
                    <TabsTrigger value="plano" className="gap-2 rounded-lg">
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
                                    <Avatar className="h-24 w-24 border-2 border-border/50 shadow-xl overflow-hidden">
                                        <AvatarImage src={profile.avatar_url} className="object-cover" />
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold uppercase text-white">
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
                                    <h3 className="text-lg font-semibold">Foto de Perfil</h3>
                                    <p className="text-xs text-muted-foreground mb-3">JPG, GIF ou PNG. Tamanho máximo de 2MB.</p>
                                    <div className="flex gap-2 justify-center sm:justify-start">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="glass-light border-border/50 relative overflow-hidden"
                                            onClick={() => document.getElementById('avatar-upload')?.click()}
                                            type="button"
                                        >
                                            {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                                            Alterar
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive">Remover</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <Input
                                        id="name"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        placeholder="Seu nome"
                                        className="glass-light"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="glass-light opacity-60"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                                <Button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
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
                        className="bento-card p-6 space-y-6"
                    >
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Preferências de Notificação</h3>
                            <p className="text-sm text-muted-foreground">Escolha como você quer ser notificado sobre suas atividades.</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { title: "E-mail de Próximos Eventos", desc: "Receba um resumo diário da sua agenda por e-mail." },
                                { title: "Notificações na Web", desc: "Alertas em tempo real enquanto você usa o app." },
                                { title: "Atualizações de Projetos", desc: "Seja notificado quando um projeto mudar de status." },
                                { title: "Novas Mensagens", desc: "Receba alertas instantâneos de novas conversas no chat." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 glass-light rounded-xl border border-border/30">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
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
                        className="bento-card p-6 space-y-6"
                    >
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Autenticação e Acesso</h3>
                            <p className="text-sm text-muted-foreground">Mantenha sua conta protegida com as melhores práticas de segurança.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 glass-light rounded-xl border border-border/30 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Alterar Senha</p>
                                    <p className="text-xs text-muted-foreground">Última alteração há 3 meses.</p>
                                </div>
                                <Button variant="outline" size="sm" className="glass-light">Atualizar</Button>
                            </div>

                            <div className="p-4 glass-light rounded-xl border border-border/30 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Autenticação de Dois Fatores (2FA)</p>
                                    <p className="text-xs text-muted-foreground text-primary font-medium">Recomendado para maior segurança.</p>
                                </div>
                                <Button variant="outline" size="sm" className="glass-light border-primary/30 text-primary">Ativar</Button>
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>

                <TabsContent value="aparencia">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bento-card p-6 space-y-6"
                    >
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Personalização</h3>
                            <p className="text-sm text-muted-foreground">Ajuste o visual da NoteFreela ao seu gosto.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 glass-light rounded-2xl border-2 border-primary/50 relative cursor-pointer group">
                                <div className="w-full aspect-video bg-slate-950 rounded-lg mb-3 border border-border/50 overflow-hidden">
                                    <div className="w-1/3 h-full bg-slate-900 border-r border-border/50 p-2 space-y-1">
                                        <div className="h-1 w-full bg-primary/20 rounded" />
                                        <div className="h-1 w-2/3 bg-muted/20 rounded" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-center">Dark Mode (Padrão)</p>
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                                    <Check className="h-3 w-3" />
                                </div>
                            </div>

                            <div className="p-6 glass-light rounded-2xl border border-border/30 hover:border-border/60 transition-all cursor-pointer group">
                                <div className="w-full aspect-video bg-white rounded-lg mb-3 border border-border/50 overflow-hidden">
                                    <div className="w-1/3 h-full bg-slate-50 border-r border-border/50 p-2 space-y-1">
                                        <div className="h-1 w-full bg-primary/20 rounded" />
                                        <div className="h-1 w-2/3 bg-muted/20 rounded" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-center text-muted-foreground">Light Mode</p>
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>

                <TabsContent value="plano">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bento-card p-8 text-center space-y-6"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <CreditCard className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">Plano Atual: Free Beta</Badge>
                            <h3 className="text-2xl font-bold">NoteFreela Pro</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                Acesso ilimitado a projetos, relatórios avançados e integração total com o calendário.
                            </p>
                        </div>

                        <div className="grid gap-3 pt-4">
                            <Button className="w-full bg-gradient-to-r from-primary to-accent h-12 text-base font-semibold">
                                Fazer Upgrade por R$ 29,90/mês
                            </Button>
                            <Button variant="ghost" className="text-muted-foreground text-xs uppercase tracking-widest">
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
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2 px-8 py-6 rounded-2xl"
                >
                    <LogOut className="h-4 w-4" /> Finalizar Sessão
                </Button>
            </div>
        </div>
    );
}
