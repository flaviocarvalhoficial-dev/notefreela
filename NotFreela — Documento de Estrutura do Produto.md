# **NotFreela — Documento de Estrutura do Produto**

## **Visão Geral**

**NotFreela** é uma plataforma de gestão operacional para freelancers e profissionais independentes, projetada para centralizar clientes, projetos, tarefas, documentos e finanças em um único ambiente de trabalho.

O sistema combina elementos de:

* Gestão de Projetos  
* CRM leve  
* Controle financeiro  
* Organização de conhecimento  
* Gestão administrativa do profissional

O objetivo é oferecer ao freelancer um **centro operacional completo**, evitando o uso fragmentado de diversas ferramentas como planilhas, aplicativos de notas, gerenciadores de tarefas e softwares financeiros.

---

# **Proposta de Valor**

O NotFreela foi projetado para resolver três grandes desafios do profissional freelancer:

1. Falta de organização operacional  
2. Fragmentação de ferramentas  
3. Falta de visão financeira e estratégica do trabalho

A plataforma atua como um **workspace operacional completo para freelancers**, reunindo:

* planejamento  
* execução  
* relacionamento com clientes  
* controle financeiro  
* documentação

Tudo dentro de uma interface simples e organizada.

---

# **Arquitetura do Sistema**

A estrutura do sistema é baseada em **módulos funcionais**, organizados através da navegação lateral principal.

## **Módulos Principais**

* Dashboard  
* Projetos  
* Tarefas  
* Agenda  
* Clientes  
* Documentos  
* Financeiro  
* Assinaturas  
* Minha Empresa  
* Caixa de Entrada

Cada módulo representa uma área específica da operação freelancer.

---

# **Dashboard — Painel de Controle**

O Dashboard oferece uma visão consolidada da operação.

## **Indicadores Principais**

* Número de projetos ativos  
* Quantidade de tarefas  
* Clientes cadastrados  
* Faturamento estimado

## **Componentes**

### **Cronograma de Entrega**

Timeline visual mostrando prazos e entregas de projetos.

### **Cockpit de Tempo**

Controle de sessões de trabalho registradas.

Permite:

* iniciar sessão  
* acompanhar tempo investido  
* visualizar histórico

### **Fluxo Financeiro**

Gráficos de evolução de faturamento.

---

# **Projetos — Diretrizes de Produção**

Este módulo concentra os projetos ativos.

Cada projeto contém:

* nome  
* descrição  
* status  
* prazo  
* valor do projeto  
* progresso  
* cliente associado

## **Visualização**

Projetos são apresentados em formato de **cards**, exibindo:

* nome do projeto  
* valor faturado  
* prazo  
* evolução percentual

Filtros disponíveis:

* faturamento  
* serviço  
* cliente

---

# **Tarefas — Cockpit de Fluxo**

Representa o ambiente operacional do projeto.

Cada projeto possui seu próprio fluxo de tarefas.

## **Estrutura**

Para cada projeto são exibidos:

* total de itens  
* ações pendentes  
* investimento  
* progresso

Esse módulo atua como um **kanban operacional interno**.

---

# **Agenda Estratégica**

Módulo responsável pela gestão temporal.

Funcionalidades:

* calendário mensal  
* criação de eventos  
* visualização de compromissos

Permite organizar:

* reuniões  
* entregas  
* prazos

---

# **Clientes — Carteira de Clientes**

Gerencia a base de clientes do freelancer.

Cada cliente possui:

* identificação  
* número de projetos  
* valor total investido

A tela também apresenta métricas consolidadas:

* investimento total  
* projetos ativos  
* número de clientes

Funciona como um **mini CRM de relacionamento**.

---

# **Documentos**

Central de documentos administrativos e operacionais.

Categorias disponíveis:

* Contratos  
* Briefings  
* Recibos  
* Notas fiscais

Funcionalidades:

* upload de arquivos  
* categorização  
* busca  
* associação com projetos

---

# **Financeiro — Gestão de Capital**

Módulo responsável pelo controle financeiro.

Indicadores exibidos:

* total recebido  
* custos totais  
* lucro líquido  
* lucro consolidado

Visualizações:

* gráficos de fluxo financeiro  
* gráficos de lucratividade

Também permite:

* registrar custos  
* exportar dados financeiros

---

# **Assinaturas**

Controle de ferramentas e custos recorrentes.

Permite registrar serviços como:

* Adobe Creative Cloud  
* Capcut  
* Google One  
* outras ferramentas

Exibe:

* custo mensal  
* vencimentos  
* status de pagamento

Também mostra:

* estimativa mensal total de ferramentas.

---

# **Minha Empresa**

Área administrativa do profissional.

Contém dados da empresa ou profissional:

* razão social  
* nome fantasia  
* CNPJ ou CPF  
* chave PIX  
* e-mail corporativo  
* telefone  
* endereço fiscal

Também gera um **cartão digital institucional** usado em:

* propostas  
* contratos  
* documentos.

---

# **Caixa de Entrada**

Módulo de captura de informações.

Funciona como um **inbox de ideias e referências**.

Pode armazenar:

* prompts  
* ideias de projetos  
* anotações  
* conteúdos em trânsito

Permite organizar informações antes de transformá-las em tarefas ou projetos.

---

# **Estrutura de Dados (Modelo Conceitual)**

Principais entidades do sistema.

## **Clientes**

Campos principais:

* id  
* nome  
* empresa  
* contato  
* observações

---

## **Projetos**

Campos principais:

* id  
* cliente\_id  
* nome  
* descrição  
* valor  
* prazo  
* status

---

## **Tarefas**

Campos principais:

* id  
* projeto\_id  
* título  
* status  
* prazo

---

## **Documentos**

Campos principais:

* id  
* projeto\_id  
* categoria  
* tipo  
* arquivo

---

## **Financeiro**

Campos principais:

* id  
* projeto\_id  
* tipo  
* valor  
* data

---

# **Posicionamento do Produto**

O NotFreela se posiciona como:

**Workspace operacional para freelancers.**

Ele não busca competir diretamente com ERPs complexos.

Seu foco é oferecer:

* simplicidade  
* centralização  
* visão estratégica da operação

---

# **Público-Alvo**

Profissionais independentes:

* designers  
* social media  
* desenvolvedores  
* criadores de conteúdo  
* consultores  
* profissionais digitais

---

# **Diferencial do Produto**

O diferencial do NotFreela está na **integração entre áreas normalmente separadas**:

* gestão de projetos  
* controle financeiro  
* CRM leve  
* gestão documental  
* organização de ideias

Tudo dentro de um único ambiente.

---

# **Possíveis Evoluções Futuras**

## **CRM completo**

Adicionar:

* funil de vendas  
* gestão de leads  
* pipeline comercial

---

## **Automação**

Automação de:

* criação de tarefas  
* geração de contratos  
* follow-up de clientes

---

## **Propostas automáticas**

Gerador de propostas comerciais.

---

## **Relatórios de performance**

Análise de:

* cliente mais lucrativo  
* tipo de serviço mais rentável  
* produtividade por projeto

---

# **Resumo**

NotFreela é uma plataforma que centraliza toda a operação de um freelancer em um único workspace.

Ele combina organização, execução e gestão financeira, permitindo que o profissional tenha controle completo de sua atividade profissional.

