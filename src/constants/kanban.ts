export const PASTEL_COLORS = [
    { name: "Ardósia", value: "hsl(215, 15%, 75%)" },
    { name: "Indigo", value: "hsl(230, 60%, 88%)" },
    { name: "Esmeralda", value: "hsl(150, 50%, 85%)" },
    { name: "Âmbar", value: "hsl(40, 70%, 85%)" },
    { name: "Pêssego", value: "hsl(25, 70%, 88%)" },
    { name: "Púrpura", value: "hsl(265, 60%, 88%)" },
    { name: "Ciano", value: "hsl(190, 60%, 85%)" },
];

export const DEFAULT_SCENARIOS = [
    { id: "default-scenario", title: "Fluxo Principal", type: "kanban", position: 0, project_id: "" }
];

export const DEFAULT_COLUMNS = [
    { id: "todo", title: "Início", hint: "Planeje e quebre em passos", color: "hsl(220, 15%, 78%)", scenario_id: "default-scenario" },
    { id: "inprogress", title: "Em Progresso", hint: "Foco no que está em execução", color: "hsl(200, 60%, 85%)", scenario_id: "default-scenario" },
    { id: "done", title: "Concluído", hint: "Entrega e validação", color: "hsl(150, 50%, 85%)", scenario_id: "default-scenario" },
];
