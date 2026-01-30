import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Auth() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                toast({
                    title: "Conta criada!",
                    description: "Verifique seu e-mail para confirmar o cadastro.",
                });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate("/");
            }
        } catch (error: any) {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card max-w-md w-full p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-bold text-background">N</span>
                    </div>
                    <h1 className="text-2xl font-bold">{isSignUp ? "Criar conta" : "Bem-vindo de volta"}</h1>
                    <p className="text-muted-foreground text-sm mt-2">
                        {isSignUp
                            ? "Comece a organizar seus freelas hoje"
                            : "Entre para gerenciar seus projetos e tarefas"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nome Completo</Label>
                            <Input
                                id="fullName"
                                placeholder="Seu nome"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="glass-light"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="glass-light"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="glass-light"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all font-semibold py-6"
                        disabled={isLoading}
                    >
                        {isLoading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-primary hover:underline"
                    >
                        {isSignUp ? "Já tem uma conta? Entre" : "Não tem uma conta? Cadastre-se"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
