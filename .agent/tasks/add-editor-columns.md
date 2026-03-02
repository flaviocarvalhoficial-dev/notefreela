# Implementação de Colunas no Editor de Projetos

Este plano detalha a adição de uma interface de inserção de colunas no `BlockEditor`, permitindo que usuários criem layouts de múltiplas colunas de forma fluida.

## Análise
- O usuário deseja uma interface de descoberta por hover na parte superior do editor.
- Um ícone "+" dentro de um círculo com uma linha vertical deve aparecer para indicar a criação de colunas.
- A funcionalidade deve permitir que o conteúdo do projeto seja organizado em colunas.

## Proposta Técnica
1.  **Interface de Hover**: Adicionar um sensor de movimento no container do `BlockEditor`.
2.  **Guia Visual (Column Guide)**: Usar `framer-motion` para renderizar uma linha vertical e um botão circular "+" que seguem (ou se fixam) em pontos de divisão.
3.  **Extensão TipTap**: Criar uma extensão customizada `Columns` que suporte blocos aninhados.
4.  **Comandos**: Adicionar comando ao menu "/" para inserção de colunas também.

## Tarefas

### 1. Extensão de Colunas (TipTap)
- Criar `ColumnsExtension` e `ColumnExtension`.
- Permitir que cada coluna tenha seu próprio conteúdo editável.

### 2. Interface de Inserção (UI)
- Modificar `BlockEditor.tsx` para detectar hover na zona superior.
- Implementar o componente `ColumnGuide`.

### 3. Integração de Dados
- Garantir que o JSON do TipTap salve corretamente a estrutura de colunas.
- Ajustar CSS para renderizar as colunas lado a lado no editor e na visualização.

## Próximos Passos
- Implementar a lógica de detecção de hover.
- Desenvolver a estrutura básica dos componentes visuais.
