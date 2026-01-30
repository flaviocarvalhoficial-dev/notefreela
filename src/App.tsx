import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import Index from "./pages/Index";
import Projetos from "./pages/Projetos";
import ProjetoDetalhes from "./pages/ProjetoDetalhes";
import Tarefas from "./pages/Tarefas";
import Agenda from "./pages/Agenda";
import Atividades from "./pages/Atividades";
import Documentos from "./pages/Documentos";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase";
import { Session } from "@supabase/supabase-js";
import { ReloadPrompt } from "@/components/ReloadPrompt";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { pathname } = useLocation();
  const isDashboard = pathname === "/";

  // Remove scrollbar do navegador apenas no Dashboard (layout encaixado)
  // e restaura para as demais rotas.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    if (isDashboard) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    } else {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [isDashboard]);

  return (
    <div className={`flex w-full bg-background ${isDashboard ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main
          className={
            isDashboard
              ? "h-[calc(100vh-4rem)] pt-20 overflow-hidden"
              : "flex-1 pt-24 overflow-auto"
          }
        >
          <div className={`max-w-[1600px] mx-auto px-6 ${isDashboard ? "h-full" : ""}`}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
              <Route path="/tarefas" element={<Tarefas />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/atividades" element={<Atividades />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/auth"
              element={!session ? <Auth /> : <Navigate to="/" replace />}
            />
            <Route
              path="/*"
              element={
                session ? (
                  <SidebarProvider defaultOpen={true}>
                    <AppLayout />
                  </SidebarProvider>
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
          </Routes>
          <Toaster />
          <Sonner />
          <ReloadPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
