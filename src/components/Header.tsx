import { useEffect, useState } from "react";
import { Bell, Search, ChevronDown, Moon, Sun, LogOut, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import packageJson from "../../package.json";

export function Header() {
    const { theme, setTheme } = useTheme();
    const { pathname } = useLocation();
    const isDashboard = pathname === "/";
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const navigate = useNavigate();

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (data) setProfile(data);
    };

    useEffect(() => {
        setMounted(true);

        // Initial fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);

                // Real-time subscription to profile changes
                const channel = supabase
                    .channel('profile-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'profiles',
                            filter: `id=eq.${session.user.id}`
                        },
                        (payload) => {
                            setProfile(payload.new);
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    const userInitial = profile?.full_name?.[0] || user?.email?.[0] || "U";
    const userName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";

    return (
        <header className="sticky top-0 w-full h-16 border-b border-border/50 glass-light z-[40]">
            <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between px-6">

                {/* Left Area: Welcome Message (Photo and Name in Line) */}
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 gap-2.5 hover:bg-muted/20 transition-all pl-0 pr-3 rounded-xl group flex items-center">
                                <Avatar className="h-8 w-8 border border-border/50 shadow-sm shrink-0">
                                    <AvatarImage src={profile?.avatar_url} className="object-cover" />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-[10px] font-bold uppercase text-white">
                                        {userInitial}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="h-full flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-xs text-muted-foreground hidden lg:inline">Bem-vindo(a),</span>
                                    <span className="text-sm font-semibold truncate max-w-[150px]">{userName.split(' ')[0]}</span>
                                    <ChevronDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="glass border-border/50 w-56 z-[60] mt-1">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{profile?.full_name || userName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => navigate("/configuracoes")}>
                                <UserIcon className="h-4 w-4" /> Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer gap-2 py-2" onClick={() => navigate("/configuracoes")}>
                                <SettingsIcon className="h-4 w-4" /> Configurações
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/50" />
                            <DropdownMenuItem className="cursor-pointer gap-2 py-2 text-destructive focus:text-destructive" onClick={handleSignOut}>
                                <LogOut className="h-4 w-4" /> Sair da conta
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Center Area: Centralized Search Box */}
                <div className="flex-1 flex justify-center px-4 max-w-lg">
                    <div className="relative group w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Pesquisar..."
                            className="w-full pl-10 h-10 glass-light border-border/50 focus:border-primary/50 transition-all rounded-full bg-background/20"
                        />
                    </div>
                </div>

                {/* Right Area: Version, Mode Toggle, Notifications */}
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="glass-light border-border/50 text-[11px] font-bold uppercase tracking-widest px-2 py-1 hidden sm:inline-flex text-muted-foreground">
                        v{packageJson.version}
                    </Badge>

                    <div className="h-8 w-[1px] bg-border/50 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full hover:bg-muted/40 transition-all"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            {mounted ? (
                                theme === "dark" ? (
                                    <Sun className="h-4 w-4 text-yellow-500 fill-yellow-500/10" />
                                ) : (
                                    <Moon className="h-4 w-4 text-slate-500 fill-slate-500/10" />
                                )
                            ) : (
                                <div className="h-4 w-4" />
                            )}
                        </Button>

                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative hover:bg-muted/40 transition-all">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary shadow-glow animate-pulse" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
