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
        // 1. Filtrar projetos com base nos seletores globais
        const filteredProjects = projects.filter((p) => {
            const pDate = p.created_at ? parseISO(p.created_at) : null;

            const matchesYear = selectedYear === "all" || (pDate && getYear(pDate).toString() === selectedYear);
            const matchesMonth = selectedMonth === "all" || (pDate && getMonth(pDate).toString() === selectedMonth);

            // Filtro de Serviço (procura no JSON services)
            const pServices = (p.services as any[]) || [];
            const matchesService = selectedServiceType === "all" ||
                pServices.some(s => s.name.toLowerCase().includes(selectedServiceType.toLowerCase()));

            return matchesYear && matchesMonth && matchesService;
        });

        // 2. Agrupar por cliente
        const clientMap = new Map();

        // Primeiro, adicionamos todos os clientes registrados no banco
        dbClients.forEach(c => {
            clientMap.set(c.id, {
                ...c,
                projects: [],
                totalValue: 0,
                activeProjects: 0
            });
        });

        // Segundo, identificamos clientes implícitos (apenas nome no projeto)
        const registeredNames = new Set(dbClients.map(c => c.name.toLowerCase()));

        projects.forEach(p => {
            if (!p.client_id && p.client_name) {
                const nameLower = p.client_name.toLowerCase();
                if (!registeredNames.has(nameLower)) {
                    const virtualId = `virtual-${nameLower}`;
                    if (!clientMap.has(virtualId)) {
                        clientMap.set(virtualId, {
                            id: virtualId,
                            name: p.client_name,
                            city: "Não cadastrado",
                            company_name: "Automático",
                            projects: [],
                            totalValue: 0,
                            activeProjects: 0
                        });
                    }
                }
            }
        });

        // 3. Vinculamos projetos filtrados aos clientes (considerando ID ou Nome)
        filteredProjects.forEach(p => {
            let client = null;
            if (p.client_id) {
                client = clientMap.get(p.client_id);
            } else if (p.client_name) {
                // Tenta encontrar pelo nome (virtual ou real)
                const nameLower = p.client_name.toLowerCase();
                for (const c of clientMap.values()) {
                    if (c.name.toLowerCase() === nameLower) {
                        client = c;
                        break;
                    }
                }
            }

            if (client) {
                client.projects.push(p);
                client.totalValue += p.value || 0;
                if (!["completed", "done"].includes(p.status)) client.activeProjects++;
            }
        });

        // Converter para array e aplicar busca textual
        return Array.from(clientMap.values()).filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
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
