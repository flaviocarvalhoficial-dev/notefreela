import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { CommercialLayout } from "@/components/layout/CommercialLayout";
import { TimerProvider } from "@/contexts/TimerContext";
import Index from "./pages/Index";
import Projetos from "./pages/Projetos";
import ProjetoDetalhes from "./pages/ProjetoDetalhes";
import Tarefas from "./pages/Tarefas";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import CaixaEntrada from "./pages/CaixaEntrada";
import Documentos from "./pages/Documentos";
import Financeiro from "./pages/Financeiro";
import Auth from "./pages/Auth";
import Atividades from "./pages/Atividades";
import Configuracoes from "./pages/Configuracoes";
import Assinaturas from "./pages/Assinaturas";
import Empresa from "./pages/Empresa";
import Leads from "./pages/Leads";
import Growth from "./pages/Growth";
import Propostas from "./pages/Propostas";
import Formularios from "./pages/Formularios";
import Intelligence from "./pages/Intelligence";
import NimbusAI from "./pages/NimbusAI";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase";
import { Session } from "@supabase/supabase-js";
import { ReloadPrompt } from "@/components/ReloadPrompt";
import { useNavigationShortcuts } from "@/hooks/use-navigation-shortcuts";
import { AIAssistantSidebar } from "@/components/AIAssistantSidebar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/LoadingScreen";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDashboard = pathname === "/";
  const isFullHeightPage = isDashboard || pathname.startsWith("/projetos/");
  const [showAI, setShowAI] = useState(false);

  // Global Keyboard Shortcuts (Linear Style)
  useNavigationShortcuts(() => navigate("/caixa-entrada"));

  // Listen for AI toggle event
  useEffect(() => {
    const handleToggleAI = () => setShowAI(prev => !prev);
    window.addEventListener("toggle-ai-assistant", handleToggleAI);
    return () => window.removeEventListener("toggle-ai-assistant", handleToggleAI);
  }, []);

  return (
    <TimerProvider>
      <div className={`flex w-full ${isFullHeightPage ? "h-screen overflow-hidden" : "min-h-screen"}`}>
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header />
          <main className={`flex-1 overflow-x-hidden ${isFullHeightPage ? "h-full overflow-hidden no-scrollbar" : "overflow-y-auto custom-scrollbar"}`}>
            <div className="w-full h-full">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/projetos" element={<Projetos />} />
                <Route path="/projetos/:id" element={<ProjetoDetalhes />} />
                <Route path="/tarefas" element={<Tarefas />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/atividades" element={<Atividades />} />
                <Route path="/caixa-entrada" element={<CaixaEntrada />} />
                <Route path="/documentos" element={<Documentos />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/assinaturas" element={<Assinaturas />} />
                <Route path="/empresa" element={<Empresa />} />

                {/* Unified Commercial Routes */}
                <Route path="/comercial" element={<CommercialLayout />}>
                  <Route index element={<Navigate to="/comercial/leads" replace />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="growth" element={<Growth />} />
                  <Route path="propostas" element={<Propostas />} />
                  <Route path="clientes" element={<Clientes />} />
                </Route>

                {/* Legacy redirects */}
                <Route path="/leads" element={<Navigate to="/comercial/leads" replace />} />
                <Route path="/growth" element={<Navigate to="/comercial/growth" replace />} />
                <Route path="/propostas" element={<Navigate to="/comercial/propostas" replace />} />
                <Route path="/clientes" element={<Navigate to="/comercial/clientes" replace />} />

                <Route path="/formularios" element={<Formularios />} />
                <Route path="/inteligencia" element={<Intelligence />} />
                <Route path="/nimbus-ai" element={<NimbusAI />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Floating AI Toggle (Right Side) */}
        {!showAI && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
          >
            <Button
              onClick={() => setShowAI(true)}
              variant="outline"
              className="h-20 w-8 p-0 rounded-l-xl rounded-r-none border-none bg-sidebar-accent/80 backdrop-blur-md hover:bg-primary/10 group flex flex-col items-center justify-center gap-2"
            >
              <ChevronLeft className="h-4 w-4 text-primary group-hover:-translate-x-0.5 transition-transform" />
              <div className="w-5 h-5 rounded-full overflow-hidden bg-white/50 border-none">
                <img src="/ai-partner.png" alt="AI" className="w-full h-full object-cover" />
              </div>
              <span className="[writing-mode:vertical-lr] text-[9px] font-bold uppercase tracking-tighter text-primary/60 group-hover:text-primary">IA</span>
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-screen overflow-hidden"
            >
              <div className="w-[320px] h-full">
                <AIAssistantSidebar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TimerProvider>
  );
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensuring animation visibility with a minimum of 4 seconds loading state
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 4000));
    const sessionFetch = supabase.auth.getSession();

    Promise.all([minLoadingTime, sessionFetch]).then(([_, { data: { session } }]) => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingScreen key="loading" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
