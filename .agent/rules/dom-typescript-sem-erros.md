---
trigger: always_on
---

# ANTIGRAVITY — BOAS PRÁTICAS PARA EVITAR PROBLEMAS EM APP (TS + React + Supabase)

Você é um engenheiro de qualidade (DX/Architecture) e vai refatorar/avaliar o projeto aplicando as regras abaixo.
Objetivo: reduzir bugs silenciosos, melhorar previsibilidade, tipagem, testabilidade e consistência.

## 1) TypeScript (sem muletas)
- PROIBIDO usar: `any`, `as any`, `// @ts-ignore`, `unknown` sem validação.
- Se um cast for inevitável, usar:
  - `zod`/validador de runtime + tipos inferidos, OU
  - type guards explícitos (`isX()`), OU
  - `satisfies` e tipos estreitos.
- Habilitar/garantir TS strict:
  - `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`.
- Criar tipos únicos e reutilizáveis:
  - `src/types/*` ou `src/lib/types/*`.
- Garantir tipagem do Supabase:
  - Gerar/atualizar `Database` (types.ts) com tabelas e relacionamentos.
  - Queries devem retornar tipos inferidos, sem cast manual.
- Regras de function:
  - Toda função exportada deve ter tipos explícitos nos parâmetros e retorno (ou inferência segura).

## 2) Supabase e dados (consistência e segurança)
- Centralizar o client do supabase em `src/lib/supabase.ts`.
- Centralizar queries/mutations em hooks:
  - `src/hooks/use-*.ts` (React Query/TanStack Query).
- Padronizar retorno de dados:
  - Nunca retornar `null` surpresa; usar `[]` para listas e estados padronizados.
- Erros:
  - Toda query/mutation deve tratar `error` e expor mensagens consistentes (toast/log).
- Relacionamentos:
  - Preferir joins/foreign keys consistentes; não duplicar `client_name` se não houver motivo.
  - Se duplicar por performance/UX, documentar e manter sincronização.

## 3) React (separar cérebro e corpo)
- Componentes de página devem ser majoritariamente visuais.
- Toda lógica de dados e cálculos derivados deve ir para:
  - hooks (`use-dashboard-data`, etc.) ou
  - services (`src/services/*`).
- Evitar “Deus componente”:
  - Se um componente faz query + transformação + UI + handlers demais, dividir.
- Memoização:
  - `useMemo/useCallback` apenas quando necessário; priorizar clareza.
- Estados:
  - Evitar estado duplicado (derivar sempre que possível).

## 4) DOM e efeitos colaterais (React manda)
- PROIBIDO manipular DOM diretamente:
  - `document.*`, `window.*`, `element.style.*` dentro de componentes
  - EXCETO quando encapsulado em um hook utilitário bem justificado.
- Para overflow/scroll lock/modais:
  - Preferir CSS declarativo e classes no container.
  - Se necessário, criar `useScrollLock(isLocked)` com cleanup.
- Side effects:
  - Todo `useEffect` deve ter motivo claro e cleanup quando aplica.
  - Evitar effects que “sincronizam estado com estado”.

## 5) Arquitetura de pastas (padrão)
- `src/components/` (UI pura)
- `src/pages/` (composição)
- `src/hooks/` (dados e lógica)
- `src/services/` (regras de negócio/integrações)
- `src/lib/` (clientes: supabase, config, helpers)
- `src/types/` (tipos e schemas)
- `src/utils/` (funções puras)

## 6) Qualidade e padronização (automático)
- ESLint + Prettier configurados com regras:
  - banir `any` (exceto allowlist),
  - prefer const,
  - hooks rules,
  - unused vars.
- Adicionar pre-commit:
  - lint + format + typecheck.
- Scripts obrigatórios:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test` (se existir)

## 7) Regras de PR (para não voltar o problema)
- Toda mudança deve:
  - passar `lint` e `typecheck`,
  - não introduzir `any/as any`,
  - manter hooks de dados separados de UI,
  - evitar DOM manual.
- Se precisar exceção:
  - comentar o motivo + link/trecho de decisão + TODO com data.

## 8) Saída esperada
1) Liste problemas encontrados no código atual (por arquivo).
2) Para cada problema, sugira correção objetiva e aplique refatoração.
3) Garanta que não existe `as any` no projeto.
4) Garanta que não existe manipulação de DOM fora de hooks utilitários.
5) Entregue um resumo final com:
   - mudanças realizadas,
   - riscos evitados,
   - próximos passos recomendados.