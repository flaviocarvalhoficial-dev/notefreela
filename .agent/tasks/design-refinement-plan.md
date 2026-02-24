# Plano de Implementação: Refinamento de Assinatura Visual (NoteFreela)

Este plano descreve as etapas para transformar a interface do NoteFreela em um sistema minimalista, sofisticado e "intelectual", seguindo as diretrizes de `@design-signature-refinement.md` e as preferências específicas do usuário.

## 1. Fundamentos (Configuração)

- [ ] **Configuração Tailwind (`tailwind.config.ts`):**
    - Atualizar tokens de `borderRadius`:
        - `lg`: `10px` (Cards)
        - `md`: `8px`
        - `sm`: `6px` (Componentes integrados)
    - Reconfigurar a família tipográfica para focar apenas nos pesos 300, 400 e 500.
    - Remover tokens de sombra obsoletos em favor de sombras "quase invisíveis".

- [ ] **Variáveis Globais (`src/index.css`):**
    - **Paleta Light:**
        - Background main: `#F7F8FA`
        - Card: `#FFFFFF`
        - Sidebar: `#F3F4F6`
        - Text primary: `#111111`
        - Text secondary: `#6B7280`
    - **Paleta Dark:**
        - Background main: `#0F1115`
        - Card: `#151821`
        - Sidebar: `#111318`
        - Text primary: `#E6E8EC`
        - Text secondary: `#9AA0A6`
    - **Remoção:** Excluir o pseudo-elemento `body::before` que gera o grid blueprint.
    - **Tipografia:** Garantir que a importação do Google Fonts inclua apenas 300, 400 e 500.

## 2. Refinamento de Componentes Base (shadcn/ui)

- [ ] **Botões (`src/components/ui/button.tsx`):**
    - Ajustar radius para `8px` (conforme sugerido no guia para botões).
    - Garantir peso `500` para botões primários.
    - Remover gradientes e sombras fortes.
- [ ] **Cards (`src/components/ui/card.tsx`):**
    - Aplicar `radius-lg` (10px).
    - Aplicar borda sutil `1px solid rgba(0,0,0,0.06)` (light) / `rgba(255,255,255,0.08)` (dark).
    - Aplicar sombra `0 1px 2px rgba(0,0,0,0.04)`.
- [ ] **Badges/Status:**
    - Padronizar para usar fundos tonais leves e peso `500`.

## 3. Experiência de Navegação

- [ ] **Sidebar:**
    - Diferenciar visualmente o fundo da sidebar do fundo principal.
    - Ajustar padding e espaçamento conforme a escala de 4px.
    - Estilizar item ativo com peso `500` e fundo tonal leve.
- [ ] **Topbar:**
    - Garantir que seja leve, com borda inferior sutil e sem sombras pesáveis.

## 4. Micro-Intencionalidade e Polimento

- [ ] **Transições:** Padronizar todas as transições para `120ms ease-out`.
- [ ] **Espaçamento:** Revisar containers principais para usar a escala base de 4px (padding de 16px, 24px, 32px).

## Critérios de Sucesso
- [ ] O app parece um "cockpit intelectual", não um template genérico.
- [ ] Consistência total de radius e pesos de fonte (300, 400, 500).
- [ ] Dark mode elegante e não meramente invertido.
- [ ] Fundo limpo e sólido.
