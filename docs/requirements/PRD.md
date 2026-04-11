# Product Requirements Document (PRD) - CRM SaaS Modular

## 1. Visão Geral
Sistema de Operação de Negócios (SaaS) modular para indivíduos e times organizarem suas atividades empresariais, gerenciando fluxos de clientes (CRM), marketing, produção e integração com plataformas externas.

### 1.1 Objetivos
- [x] **Workspaces (Multi-tenancy)**: Isolamento de dados por Área de Trabalho (Workspace).
- [ ] **Estrutura Infinitamente Escalável**: Um Workspace pode conter diversos Times (Teams).
- [x] **Flexibilidade Total**: Usuários definem suas próprias propriedades por Workspace.
- [ ] **Gestão de Convites**: Fluxo robusto para convidar membros para times específicos dentro de uma área.
- [x] **Segurança**: Autenticação moderna e segura (OAuth2/JWT) com isolamento estrito.

### 1.2 Público-Alvo (Personas)
- **Empreendedor Individual**: Organização pessoal e automação de leads.
- **Equipes de Vendas/Marketing**: Colaboração em pipelines e gestão de contatos.
- **Gerentes de Produção**: Acompanhamento de fluxos de trabalho internos.

---

## 2. Requisitos Funcionais (RF)
| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF002 | **Isolamento por Workspace**: Adicionar `workspace_id` em todas as entidades globais do tenant. | **P0 (Crítica)** | **Concluído** |
| RF003 | **Gestão de Áreas de Trabalho**: Criar, gerenciar e configurar Workspaces. | **P1 (Alta)** | **Concluído** |
| RF004 | **Gestão de Times (Teams)**: Criar múltiplos times dentro de um mesmo Workspace. | **P1 (Alta)** | Pendente |
| RF005 | **Convites & Colaboração**: Enviar convites para usuários participarem de times específicos. | **P1 (Alta)** | Pendente |
| RF006 | **Autenticação & Registro**: Registro de novo usuário associado a um novo Workspace nomeado. | **P1 (Alta)** | **Concluído** |
| RF010 | **Visibilidade por Time**: Filtro automático de dados (Contatos, Empresas, Negócios) para que usuários vejam apenas o que foi atribuído aos seus times específicos. | **P1 (Alta)** | **Pendente** |
| RF018 | **Captura de Leads (Redes)**: API/Webhook para integração com WhatsApp/IG/FB. | **P2 (Média)** | **Pendente** |
| RF007 | **Tipos Complexos & Máscaras**: CPF, CNPJ e Telefone com validação e formatação automática. | P1 (Alta) | Pendente |
| RF008 | **Interdependência de Campos**: Autopreenchimento (CEP preenche endereço) e cálculos dinâmicos. | P2 (Média) | Pendente |
| RF009 | **Recuperação de Senha**: Fluxo seguro de redefinição de senha via e-mail com tokens expiráveis. | **P1 (Alta)** | **Pendente** |
| RF011 | **Pipelines Genéricas (Workflow)**: Motor de estados que permite que qualquer entidade (Contato, Empresa, Negócio, Ticket) percorra fluxos de status customizáveis. | **P1 (Alta)** | **Planejado** |
| RF012 | **Responsividade Premium**: Padrão de alta qualidade em que todas as telas se adaptam fluidamente a Mobile, Tablet e Desktop. | **P0 (Crítica)** | **Em Andamento** |
| RF013 | **Atribuição de Dono (WorkItem)**: Todo WorkItem pode ter um usuário atribuído como dono/responsável. | **P1 (Alta)** | **Pendente** |
| RF014 | **Histórico de Atividades (WorkItem)**: Todas as ações em um WorkItem devem ser registradas automaticamente como atividades. | **P1 (Alta)** | **Pendente** |
| RF015 | **Observações em WorkItems**: O usuário poderá criar observações que também serão registradas em atividades no WorkItem. | **P1 (Alta)** | **Pendente** |
| RF016 | **Biblioteca de Modelos (Super Admin)**: O Super Administrador poderá criar e configurar Tipos de Objetos padrões (Templates) que comporão uma biblioteca global. Administradores de Workspace podem selecionar e importar esses modelos, gerando uma cópia local (clone) que pode ser personalizada independentemente. | **P1 (Alta)** | **Em Andamento** |
| RF017 | **Configuração de SMTP (Workspace)**: Cada Área de Trabalho deve possuir sua própria configuração de SMTP para envio de e-mails, gerenciável exclusivamente pelo Administrador da área. | **P1 (Alta)** | **Pendente** |
| RF019 | **API Pública (Leads Inbound)**: Criação de API configurável e segura para receber leads gerados por fontes e aplicações de terceiros (ex: formulário de website) injetando-os direto no CRM. | **P1 (Alta)** | **Pendente** |
| RF020 | **Gestão de Planos (SaaS)**: O Super Administrador poderá criar e gerenciar planos de assinatura, definindo limites de recursos, preços e permissões atrelados a cada plano da Área de Trabalho. | **P1 (Alta)** | **Pendente** |
| RF021 | **Vinculação entre WorkItems**: Um WorkItem pode ser vinculado a um ou mais outros WorkItems. Na visualização, os vínculos são exibidos agrupados por tipo de WorkItem (ex: Contatos, Negócios, Tickets). A relação é bidirecional e isolada por `workspace_id`. | **P1 (Alta)** | **Pendente** |

---

## 3. Requisitos Não Funcionais (RNF)
- **Escalabilidade**: Arquitetura pronta para milhares de tenants.
- **Segurança**: Criptografia de dados sensíveis e isolamento estrito: `Workspace` isola a base e `Team` isola a visibilidade dos registros.
- **Usabilidade**: Interface intuitiva para configuração de fluxos complexos.
- **Padrão Visual**: Todas as telas e componentes devem seguir um padrão de alta fidelidade (Premium UI), garantindo fluidez em qualquer resolução.


---

## 4. Roadmap Modular (Ordem de Construção)
1.  **Módulo de Propriedades Dinâmicas**: Refinamento e UI de gestão.
2.  **Módulo de Gestão de Times & Auth**: Estrutura de Users, Teams, Invites e Tenancy.
3.  **Módulo de Fluxos (Pipelines)**: Estruturação de estágios e transições.
4.  **Módulo de Integrações externas**: Webhooks e conectores sociais.

---

## 5. User Stories (Exemplos Iniciais)
- **Como** um novo usuário, **eu quero** criar um Workspace "Minha Agência" ao me cadastrar **para que** eu possa organizar meus diversos times de "Vendas" e "Sucesso" no mesmo lugar.
- **Como** administrador de Workspace, **eu quero** convidar membros para times específicos **para que** o acesso aos dados seja restrito conforme a função de cada um.
- **Como** atendente, **eu quero** que ao digitar o CEP, os campos de endereço sejam preenchidos **para que** eu minimize o erro humano e agilize o atendimento.
- **Como** colaborador de um time, **eu quero** ser designado como dono de um WorkItem **para que** eu saiba exatamente quais tarefas são de minha responsabilidade.
- **Como** gerente ou analista, **eu quero** registrar notas e ver o histórico de ações de um WorkItem **para que** eu possa acompanhar todas as mudanças e contextos associados do histórico e progresso.
- **Como** Super Administrador da plataforma, **eu quero** criar uma biblioteca de modelos de tipos de objetos **para que** eu possa oferecer estruturas pré-prontas e padronizadas para diferentes nichos de mercado.
- **Como** Administrador de Workspace, **eu quero** navegar na biblioteca global e importar modelos de tipos de objetos **para que** eu economize tempo na configuração inicial e possa personalizar a cópia conforme minha necessidade específica.
- **Como** Administrador de Workspace, **eu quero** configurar os dados de servidor SMTP de minha empresa **para que** os e-mails enviados pelo sistema em nome do meu time utilizem o meu próprio domínio e servidor de forma segura.
- **Como** gerente de marketing, **eu quero** disponibilizar um endpoint de API do meu CRM para o meu website **para que** os formulários preenchidos caiam diretamente no funil de vendas, sem entrada manual.
- **Como** Super Administrador (Vendor) da plataforma, **eu quero** ser capaz de criar planos de assinatura parametrizados (ex: preços, limite de licenças e acesso a módulos) **para que** eu consiga gerenciar e monetizar a base de clientes do SaaS sob diferentes esteiras de oferta.
- **Como** membro de um time, **eu quero** vincular um WorkItem a outros WorkItems relacionados **para que** eu possa enxergar, em um único painel organizado por tipo, todas as relações do objeto — como um Ticket originado de um Contato ou um Negócio ligado a uma Empresa.

---

## 6. Métricas de Sucesso
- Adoção de pipelines customizadas por > 80% dos usuários.
- Redução no tempo de entrada de leads via automação.
