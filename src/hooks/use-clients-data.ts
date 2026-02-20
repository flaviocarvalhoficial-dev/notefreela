import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, getYear, getMonth } from "date-fns";

export function useClientsData() {
    // Filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [selectedServiceType, setSelectedServiceType] = useState<string>("all");

    // Fetch de Clientes e Projetos
    const { data: dbClients = [], isLoading: loadingClients } = useQuery({
        queryKey: ["clients-raw"],
        queryFn: async () => {
            const { data, error } = await supabase.from("clients").select("*").order("name");
            if (error) throw error;
            return data;
        },
    });

    const { data: projects = [], isLoading: loadingProjects } = useQuery({
        queryKey: ["projects-clients-page"],
        queryFn: async () => {
            const { data, error } = await supabase.from("projects").select("*");
            if (error) throw error;
            return data;
        },
    });

    // Processamento de Filtros e Agregação
    const filteredData = useMemo(() => {
        const clientMap = new Map();

        // Pass 1: Registrar todos os clientes conhecidos
        dbClients.forEach(c => {
            clientMap.set(c.id, {
                ...c,
                allProjects: [],
                projects: [],
                totalValue: 0,
                activeProjects: 0
            });
        });

        // Pass 2: Identificar clientes virtuais e agrupar projetos
        projects.forEach(p => {
            let clientRef = null;
            if (p.client_id) {
                clientRef = clientMap.get(p.client_id);
            } else if (p.client_name) {
                const nameLower = p.client_name.toLowerCase();
                // Tenta encontrar por nome nos clientes já mapeados
                for (const c of clientMap.values()) {
                    if (c.name.toLowerCase() === nameLower) {
                        clientRef = c;
                        break;
                    }
                }

                // Se não achou e é um nome novo, cria cliente virtual
                if (!clientRef) {
                    const virtualId = `virtual-${nameLower}`;
                    clientRef = {
                        id: virtualId,
                        name: p.client_name,
                        city: "Não cadastrado",
                        company_name: "Automático",
                        allProjects: [],
                        projects: [],
                        totalValue: 0,
                        activeProjects: 0
                    };
                    clientMap.set(virtualId, clientRef);
                }
            }

            if (clientRef) {
                // Adiciona ao histórico completo sempre
                clientRef.allProjects.push(p);

                // Aplica filtros globais para ver se entra na visão atual do card
                const pDate = p.created_at ? parseISO(p.created_at) : null;
                const matchesYear = selectedYear === "all" || (pDate && getYear(pDate).toString() === selectedYear);
                const matchesMonth = selectedMonth === "all" || (pDate && getMonth(pDate).toString() === selectedMonth);

                const pServices = (p.services as any[]) || [];
                const matchesService = selectedServiceType === "all" ||
                    pServices.some(s => {
                        const sName = typeof s === 'string' ? s : s?.name;
                        return sName?.toLowerCase().includes(selectedServiceType.toLowerCase());
                    });

                if (matchesYear && matchesMonth && matchesService) {
                    clientRef.projects.push(p);
                    clientRef.totalValue += (p.value || 0);
                    if (!["completed"].includes(p.status)) {
                        clientRef.activeProjects++;
                    }
                }
            }
        });

        // Pass 3: Filtragem final da lista de clientes
        const hasActiveFilters = selectedYear !== "all" || selectedMonth !== "all" || selectedServiceType !== "all";

        return Array.from(clientMap.values()).filter(c => {
            const matchesSearch =
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.company_name?.toLowerCase() || "").includes(searchQuery.toLowerCase());

            // Se tem filtro de tempo/serviço, esconde quem não tem projeto no período
            if (hasActiveFilters && c.projects.length === 0) return false;

            return matchesSearch;
        });
    }, [dbClients, projects, searchQuery, selectedYear, selectedMonth, selectedServiceType]);

    // Indicadores Globais (Baseados no Filtro)
    const stats = useMemo(() => {
        const totalInvested = filteredData.reduce((acc, c) => acc + c.totalValue, 0);
        const totalProjects = filteredData.reduce((acc, c) => acc + c.projects.length, 0);
        const totalActive = filteredData.reduce((acc, c) => acc + c.activeProjects, 0);

        return { totalInvested, totalProjects, totalActive };
    }, [filteredData]);

    // Opções para os Filtros (Extraídas dos dados reais)
    const filterOptions = useMemo(() => {
        const years = new Set<string>();
        const serviceTypes = new Set<string>();

        projects.forEach(p => {
            if (p.created_at) years.add(getYear(parseISO(p.created_at)).toString());
            const pServices = (p.services as any[]) || [];
            pServices.forEach(s => serviceTypes.add(s.name));
        });

        return {
            years: Array.from(years).sort((a, b) => b.localeCompare(a)),
            services: Array.from(serviceTypes).sort()
        };
    }, [projects]);

    return {
        clients: filteredData,
        stats,
        filterOptions,
        isLoading: loadingClients || loadingProjects,
        filters: {
            searchQuery,
            setSearchQuery,
            selectedYear,
            setSelectedYear,
            selectedMonth,
            setSelectedMonth,
            selectedServiceType,
            setSelectedServiceType
        }
    };
}
