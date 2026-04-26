# Product Requirements Document (PRD) - CRM SaaS Modular

## 1. Visão Geral
Sistema de Operação de Negócios (SaaS) modular para indivíduos e times organizarem suas atividades empresariais, gerenciando fluxos de clientes (CRM), marketing, produção e integração com plataformas externas.

### 1.1 Objetivos
- [x] **Workspaces (Multi-tenancy)**: Isolamento de dados por Área de Trabalho (Workspace).
- [x] **Estrutura Infinitamente Escalável**: Um Workspace pode conter diversos Times (Teams).
- [x] **Flexibilidade Total**: Usuários definem suas próprias propriedades por Workspace.
- [x] **Gestão de Convites**: Fluxo robusto para convidar membros para times específicos dentro de uma área.
- [x] **Segurança**: Autenticação moderna e segura (OAuth2/JWT) com isolamento estrito.

### 1.2 Público-Alvo (Personas)
- **Empreendedor Individual**: Organização pessoal e automação de leads.
- **Equipes de Vendas/Marketing**: Colaboração em pipelines e gestão de contatos.
- **Gerentes de Produção**: Acompanhamento de fluxos de trabalho internos.

---

## 2. Requisitos Funcionais (RF)
| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF002 | **Isolamento por Workspace**: Adicionar `workspace_id` em todas as entidades globais do tenant. | **P0 (Crítica)** | **✅ Concluído** |
| RF003 | **Gestão de Áreas de Trabalho**: Criar, gerenciar e configurar Workspaces (nome, logo, cores, mensagem de convite). | **P1 (Alta)** | **✅ Concluído** |
| RF004 | **Gestão de Times (Teams)**: Criar, listar e remover múltiplos times dentro de um mesmo Workspace. | **P1 (Alta)** | **✅ Concluído** |
| RF005 | **Convites & Colaboração**: Enviar convites por e-mail (com SMTP), validar token, aceitar convite e associar usuário ao Workspace/Time. Cancelar convites pendentes. | **P1 (Alta)** | **✅ Concluído** |
| RF006 | **Autenticação & Registro**: Registro de novo usuário associado a um novo Workspace nomeado. Login com retorno de dados do Workspace. | **P1 (Alta)** | **✅ Concluído** |
| RF009 | **Recuperação de Senha**: Fluxo completo de redefinição — solicitação via "Esqueci minha senha", envio de e-mail com token JWT expirável e tela de definição de nova senha. | **P1 (Alta)** | **✅ Concluído** |
| RF011 | **Pipelines Genéricas (Workflow)**: Motor de estados genérico vinculado a `WorkItemType`. Criação, edição, exclusão de pipelines com estágios ordenados. Movimentação de entidades entre estágios com histórico. Importação de pipelines de modelos globais. | **P1 (Alta)** | **✅ Concluído** |
| RF012 | **Responsividade Premium**: Padrão de alta qualidade em que todas as telas se adaptam fluidamente a Mobile, Tablet e Desktop. Sidebar colapsável, header mobile, overlay. | **P0 (Crítica)** | **✅ Concluído** |
| RF013 | **Atribuição de Dono (WorkItem)**: Todo WorkItem possui campo `owner_id` com atribuição, remoção e exibição de avatar/iniciais no Kanban. | **P1 (Alta)** | **✅ Concluído** |
| RF014 | **Histórico de Atividades (WorkItem)**: Todas as ações (criação, movimentação de estágio, edição de campos, atribuição de dono) são registradas automaticamente como atividades com timestamps e autores. | **P1 (Alta)** | **✅ Concluído** |
| RF015 | **Observações em WorkItems**: O usuário pode criar notas/observações que são registradas como atividades no histórico do WorkItem. | **P1 (Alta)** | **✅ Concluído** |
| RF016 | **Biblioteca de Modelos (Super Admin)**: O Super Administrador pode criar e configurar Tipos de Objetos globais (Templates) com campos e grupos, que compõem uma biblioteca global. Administradores de Workspace podem listar, importar (clonar) e personalizar localmente. Inclui importação massiva de campos. | **P1 (Alta)** | **✅ Concluído** |
| RF022 | **Pool de Campos Globais (Campos Sugeridos)**: Campos opcionais no modelo global (com `is_default=False`) não são clonados no import inicial. Ficam disponíveis para o Admin do Workspace adicionar sob demanda. Inclui verificação de atualizações e sincronização manual com o modelo global original. | **P1 (Alta)** | **✅ Concluído** |
| RF010 | **Visibilidade por Time**: Filtro automático de dados (Contatos, Empresas, Negócios) para que usuários vejam apenas o que foi atribuído aos seus times específicos. | **P1 (Alta)** | **✅ Concluído** |
| RF007 | **Tipos Complexos & Máscaras**: CPF, CNPJ e Telefone com validação e formatação automática no frontend (input masks). | P1 (Alta) | **Em Andamento** |
| RF008 | **Interdependência de Campos**: Autopreenchimento (CEP preenche endereço) e cálculos dinâmicos. | P2 (Média) | Pendente |
| RF017 | **Configuração de SMTP (Workspace)**: Cada Área de Trabalho deve possuir sua própria configuração de SMTP para envio de e-mails, gerenciável exclusivamente pelo Administrador da área. | **P1 (Alta)** | **✅ Concluído** |
| RF018 | **Captura de Leads (Redes)**: API/Webhook para integração com WhatsApp/IG/FB. | **P2 (Média)** | **Pendente** |
| RF019 | **API Pública (Leads Inbound)**: Criação de API configurável e segura para receber leads gerados por fontes e aplicações de terceiros (ex: formulário de website) injetando-os direto no CRM. | **P1 (Alta)** | **✅ Concluído** |
| RF020 | **Gestão de Planos (SaaS)**: O Super Administrador poderá criar e gerenciar planos de assinatura, definindo limites de recursos, preços e permissões atrelados a cada plano da Área de Trabalho. | **P1 (Alta)** | **Pendente** |
| RF021 | **Vinculação entre WorkItems**: Um WorkItem pode ser vinculado a um ou mais outros WorkItems. Na visualização, os vínculos são exibidos agrupados por tipo de WorkItem (ex: Contatos, Negócios, Tickets). A relação é bidirecional e isolada por `workspace_id`. | **P1 (Alta)** | **✅ Concluído** |
| RF023 | **Onboarding Inteligente (Empty State de Módulos)**: Substituir tela vazia por vitrine de modelos (templates) com cards visuais e instalação em 1 clique. | **P1 (Alta)** | **Pendente** |
| RF024 | **Editor Visual com Live Preview**: Redesenho do criador de tipos de objetos com foco em *Progressive Disclosure* (campos básicos vs avançados) e pré-visualização em tempo real do formulário. | **P1 (Alta)** | **Pendente** |
| RF025 | **Gestão Administrativa de Templates Globais**: Interface de Super Admin para gerenciar o catálogo de modelos, incluindo descrições de marketing, ícones e categorização. | **P1 (Alta)** | **Pendente** |
| RF026 | **Template de Tarefas Mandatório**: Provisionamento automático do tipo "Tarefa" e sua pipeline padrão em todo novo Workspace. | **P0 (Crítica)** | **✅ Concluído** |
| RF027 | **Central de Tarefas (My Tasks Center)**: Painel consolidado do usuário para gerir suas tarefas diárias, vencidas e sem data, focado em produtividade operacional. | **P1 (Alta)** | **✅ Concluído** |
| RF028 | **Perfil do Usuário & Ativação (Onboarding)**: Interface para o usuário complementar informações pessoais (avatar, WhatsApp, cargo) e ativar seu perfil, personalizando sua identidade no Workspace. | **P1 (Alta)** | **✅ Concluído** |
| RF029 | **Alteração de Senha (Logado)**: Funcionalidade no perfil do usuário permitindo a troca de senha mediante validação da senha atual. | **P2 (Média)** | **✅ Concluído** |
| RF030 | **Tarefas Recorrentes**: Permitir que tarefas sejam configuradas para repetição automática (Diário, Semanal, Mensal, Anual). Geração da próxima ocorrência ao concluir a atual. | **P1 (Alta)** | **✅ Concluído** |
| RF031 | **Visualização em Calendário**: Interface visual de calendário (mês/semana) para visualização de prazos e agendamentos de tarefas e compromissos. | **P1 (Alta)** | **✅ Concluído** |
| RF032 | **Página Inicial Personalizável (Home)**: Criar uma tela de entrada rápida (Quartel General) com "cards" de atalho para funcionalidades frequentes, substituindo o Dashboard como página inicial padrão. | **P1 (Alta)** | **Pendente** |
| RF033 | **Gestão de Widgets da Home**: Permitir que o usuário adicione, remova e reordene os cards/atonalhos da sua página inicial através de um painel de configuração, salvando as preferências no perfil. | **P2 (Média)** | **Pendente** |
| RF034 | **Biblioteca de Widgets (Home)**: Catálogo (Drawer lateral) de cards disponíveis para customização da tela inicial. Arquitetura extensível para fácil adição de novos widgets. | **P2 (Média)** | **Pendente** |
| RF035 | **Calendário Global (Cross-Workspace)**: Visão unificada de tarefas e compromissos, mesclando dados de todos os Workspaces aos quais o usuário tem acesso. | **P2 (Média)** | **Pendente** |
| RF036 | **Central de Mensagens Unificada**: Caixa de entrada agregando mensagens, notificações e menções de múltiplas Áreas de Trabalho em um único local. | **P2 (Média)** | **Pendente** |
| RF037 | **Mensageria Interna (P2P)**: Sistema de chat direto (Direct Messages) permitindo comunicação ágil entre usuários do sistema, independente do Workspace. | **P3 (Baixa)** | **Pendente** |

---

## 3. Requisitos Não Funcionais (RNF)
- **Escalabilidade**: Arquitetura pronta para milhares de tenants.
- **Segurança**: Criptografia de dados sensíveis e isolamento estrito: `Workspace` isola a base e `Team` isola a visibilidade dos registros.
- **Usabilidade**: Interface intuitiva para configuração de fluxos complexos.
- **Padrão Visual**: Todas as telas e componentes devem seguir um padrão de alta fidelidade (Premium UI), garantindo fluidez em qualquer resolução.
- **Performance de Entrada (NFR-P003)**: A página Home deve carregar em ≤ 300ms, utilizando cache local para atalhos e skeleton loading para dados dinâmicos.
- **Logging Centralizado**: Logger estruturado com níveis (INFO, ERROR, EXCEPTION) e tratamento padronizado de exceções de domínio.
- **Clean Architecture**: Backend segue separação em camadas (Domain, Application, Infrastructure) com Repositórios abstratos e Injeção de Dependências.

---

## 4. Arquitetura Técnica Implementada

### 4.1 Backend (Python / FastAPI)
```
backend/
├── main.py                          # Entrypoint: FastAPI + CORS + Rotas
├── src/
│   ├── domain/
│   │   ├── entities/                # Entidades de Domínio (dataclasses)
│   │   │   ├── user.py
│   │   │   ├── workspace.py
│   │   │   ├── team.py
│   │   │   ├── invitation.py
│   │   │   ├── pipeline.py
│   │   │   ├── work_item.py         # WorkItem, WorkItemType, CustomFieldDefinition, FieldType
│   │   │   ├── work_item_history.py
│   │   │   └── audit_log.py
│   │   ├── exceptions/              # Exceções de Domínio (DomainException, AuthenticationException)
│   │   └── repositories/            # Contratos (Interfaces Abstratas)
│   ├── application/
│   │   ├── dtos/                    # Data Transfer Objects (Pydantic)
│   │   └── use_cases/               # Casos de Uso
│   │       ├── auth_use_cases.py
│   │       ├── password_reset_use_case.py
│   │       ├── workspace_use_cases.py
│   │       ├── team_use_cases.py
│   │       ├── invitation_use_case.py
│   │       ├── pipeline_use_cases.py
│   │       ├── settings_use_cases.py
│   │       ├── admin_use_cases.py
│   │       └── work_item/           # CRUD, Move, History, Types, Delete
│   └── infrastructure/
│       ├── api/routes/              # 8 routers (auth, admin, admin_settings, pipelines, workspaces, work_items, invitations, teams)
│       ├── database/                # SQLAlchemy Models + init_db
│       ├── repositories/            # Implementações concretas dos repositórios
│       ├── security/                # auth_utils (JWT, hash, tokens)
│       ├── services/                # email_service.py (SMTP)
│       └── utils/                   # logger.py
```

### 4.2 Frontend (React + Vite)
```
frontend/src/
├── App.jsx                          # Roteamento por estado + Auth guard
├── context/
│   └── AuthContext.jsx              # Provider de autenticação
├── components/
│   ├── auth/                        # Login, Register, ForgotPassword, ResetPassword, AcceptInvite
│   ├── common/                      # Modal, Toast, ContextMenu, GenericBoard, EntityBoardCard
│   ├── kanban/                      # WorkItemBoard, WorkItemCard, WorkItemModal, WorkItemHistoryPanel, AssignWorkItemModal
│   ├── screens/                     # 15 telas completas
│   │   ├── Dashboard.jsx
│   │   ├── Contacts.jsx / Companies.jsx   # Entidades genéricas com tabela + Kanban
│   │   ├── GenericEntityScreen.jsx        # Tela genérica por WorkItemType
│   │   ├── GenericEntityDetails.jsx       # Detalhes de entidade
│   │   ├── PipelineBoardScreen.jsx        # Quadro Kanban dinâmico
│   │   ├── PipelineSettings.jsx           # Gestão de Pipelines e Estágios
│   │   ├── PropertySettings.jsx           # Gestão de Campos customizados
│   │   ├── WorkItemTypeSettings.jsx       # Gestão de Tipos de Objetos
│   │   ├── WorkspaceSettings.jsx          # Personalização do Workspace
│   │   ├── WorkspaceMembers.jsx           # Membros, Times e Convites
│   │   ├── AdminUsers.jsx                 # Listagem de usuários (SuperAdmin)
│   │   ├── AdminTemplates.jsx             # Biblioteca Global de Templates
│   │   ├── SystemSettings.jsx             # Configurações do Sistema (SMTP, etc.)
│   │   └── Reports.jsx                    # Relatórios (placeholder)
│   ├── Sidebar.jsx                  # Navegação lateral colapsável
│   └── Header.jsx                   # Header com seletor de pipeline
└── utils/                           # Utilitários JS
```

### 4.3 Banco de Dados (Supabase / PostgreSQL)
**12 Tabelas**:
`workspaces`, `teams`, `users`, `memberships`, `pipelines`, `pipeline_stages`, `work_item_types`, `work_item_field_groups`, `work_item_field_definitions`, `work_items`, `work_item_history`, `workspace_invitations`, `system_settings`, `work_item_links`

### 4.4 Tipos de Campo Suportados (FieldType)
`text`, `number`, `date`, `select`, `multiselect`, `textarea`, `boolean`, `currency`, `email`, `cpf`, `cep`, `phone`

---

## 5. Roadmap Modular (Ordem de Construção)
1.  ~~**Módulo de Propriedades Dinâmicas**: Refinamento e UI de gestão.~~ ✅
2.  ~~**Módulo de Gestão de Times & Auth**: Estrutura de Users, Teams, Invites e Tenancy.~~ ✅
3.  ~~**Módulo de Fluxos (Pipelines)**: Estruturação de estágios e transições.~~ ✅
4.  ~~**Módulo de Vinculação entre WorkItems**: Relações bidirecionais entre objetos.~~ ✅
5.  **Módulo de Visibilidade por Time**: Filtro de dados por `team_id`. | ✅ Concluído
6.  **Módulo de Modernização UI/UX (Módulos)**: Onboarding, Templates, Home Personalizável e Live Preview. | **Pendente**
7.  **Módulo de Integrações externas**: Webhooks e conectores sociais. | Pendente
8.  **Módulo de Planos & Assinaturas**: Monetização SaaS. | Pendente

---

## 6. User Stories (Exemplos Iniciais)
- ✅ **Como** um novo usuário, **eu quero** criar um Workspace "Minha Agência" ao me cadastrar **para que** eu possa organizar meus diversos times de "Vendas" e "Sucesso" no mesmo lugar.
- ✅ **Como** administrador de Workspace, **eu quero** convidar membros para times específicos **para que** o acesso aos dados seja restrito conforme a função de cada um.
- **Como** atendente, **eu quero** que ao digitar o CEP, os campos de endereço sejam preenchidos **para que** eu minimize o erro humano e agilize o atendimento.
- ✅ **Como** colaborador de um time, **eu quero** ser designado como dono de um WorkItem **para que** eu saiba exatamente quais tarefas são de minha responsabilidade.
- ✅ **Como** gerente ou analista, **eu quero** registrar notas e ver o histórico de ações de um WorkItem **para que** eu possa acompanhar todas as mudanças e contextos associados do histórico e progresso.
- ✅ **Como** Super Administrador da plataforma, **eu quero** criar uma biblioteca de modelos de tipos de objetos **para que** eu possa oferecer estruturas pré-prontas e padronizadas para diferentes nichos de mercado.
- ✅ **Como** Administrador de Workspace, **eu quero** navegar na biblioteca global e importar modelos de tipos de objetos **para que** eu economize tempo na configuração inicial e possa personalizar a cópia conforme minha necessidade específica.
- **Como** Administrador de Workspace, **eu quero** configurar os dados de servidor SMTP de minha empresa **para que** os e-mails enviados pelo sistema em nome do meu time utilizem o meu próprio domínio e servidor de forma segura.
- **Como** gerente de marketing, **eu quero** disponibilizar um endpoint de API do meu CRM para o meu website **para que** os formulários preenchidos caiam diretamente no funil de vendas, sem entrada manual.
- **Como** Super Administrador (Vendor) da plataforma, **eu quero** ser capaz de criar planos de assinatura parametrizados (ex: preços, limite de licenças e acesso a módulos) **para que** eu consiga gerenciar e monetizar a base de clientes do SaaS sob diferentes esteiras de oferta.
- **Como** membro de um time, **eu quero** vincular um WorkItem a outros WorkItems relacionados **para que** eu possa enxergar, em um único painel organizado por tipo, todas as relações do objeto — como um Ticket originado de um Contato ou um Negócio ligado a uma Empresa.
- **Como** usuário do sistema, **eu quero** poder configurar meu perfil adicionando minha foto (avatar), WhatsApp e outras informações **para que** meus colegas de time possam me identificar facilmente nas tarefas e históricos do CRM.
- **Como** usuário autenticado, **eu quero** poder alterar minha senha nas configurações do meu perfil **para que** eu possa manter a segurança da minha conta atualizada.
- **Como** gestor ou colaborador, **eu quero** visualizar minhas tarefas em uma visão de calendário **para que** eu possa planejar minha semana e identificar gargalos de prazos visualmente.
- **Como** usuário, **eu quero** clicar em uma tarefa no calendário para ver seus detalhes e editá-la **para que** eu possa gerenciar meus compromissos sem trocar de tela.

---

## 7. Métricas de Sucesso
- Adoção de pipelines customizadas por > 80% dos usuários.
- Redução no tempo de entrada de leads via automação.
- Satisfação do usuário com a experiência responsiva (Mobile/Tablet/Desktop).
- Taxa de conversão de convites enviados vs. aceitos.
- Frequência de uso da visão de calendário para planejamento semanal.

---

---
187: 
188: ## 9. Design & Prototipagem (Wireframes)
189: 
190: Documentação visual dos conceitos de UX/UI discutidos:
191: 
192: - [**Módulos & Onboarding (Modernização)**](file:///C:/Users/Admin/.gemini/antigravity/brain/67f1c977-e3d2-41a0-8b11-ab69271195d8/ux_wireframes_crm.md): Conceitos de *Empty State* com vitrine de templates e o novo *Live Preview Builder*.
193: - [**Central de Tarefas (My Tasks Center)**](file:///C:/Users/Admin/.gemini/antigravity/brain/67f1c977-e3d2-41a0-8b11-ab69271195d8/wireframe_my_tasks_center.md): Layout de quartel-general diário com visão de 3 colunas (Vencidas, Hoje, Backlog) e acesso global via *Drawer*.
194: 
195: ---
196: 
197: ## 8. Changelog de Atualizações do PRD

| 26/04/2026 | Brainstorming de funcionalidades **Cross-Workspace** e expansão da Home. Adicionados **RF034 (Biblioteca de Widgets)**, **RF035 (Calendário Global)**, **RF036 (Mensagens Unificadas)** e **RF037 (Chat P2P)**. O foco futuro da Home será agregar contexto de todos os Workspaces do usuário. |
| 24/04/2026 | Conclusão do **Módulo de Perfil e Segurança (RF028 e RF029)**. Implementada interface premium para gestão de avatar, cargo e contatos, além de alteração segura de senha e sincronização de dados via AuthContext. |
| 24/04/2026 | Conclusão da **Central de Tarefas (RF027)** e **Visualização em Calendário (RF031)**. Implementada gestão de `date_range` (campo `prazo`), drag-to-resize, filtros por listas inteligentes (Meu Dia, Importante, etc.) e migração completa para infraestrutura **Supabase/PostgreSQL**. |
| 23/04/2026 | Inclusão do **RF031 (Visualização em Calendário)**. O objetivo é permitir o planejamento temporal de tarefas em grade mensal/semanal. |
| 23/04/2026 | Conclusão do **RF030 (Tarefas Recorrentes)**. Implementada lógica de clonagem automática e interface de configuração no modal. |
| 20/04/2026 | Inclusão do **RF029 (Alteração de Senha)**, permitindo que usuários já autenticados alterem sua credencial nas configurações de perfil. |
| 20/04/2026 | Inclusão do **RF028 (Perfil do Usuário & Ativação)**, permitindo personalização de avatar e adição de contatos como WhatsApp e telefone. |
| 20/04/2026 | Expansão da visão de Produtividade. Adicionados requisitos **RF026 (Tarefas Mandatórias)** e **RF027 (Central de Tarefas)**. O sistema passará a provisionar tarefas automaticamente para facilitar o fluxo de trabalho diário. |
| 20/04/2026 | Brainstorming de Modernização UI/UX. Adicionados requisitos **RF023 (Empty State/Onboarding)**, **RF024 (Live Preview Builder)** e **RF025 (Admin de Templates)**. Decidida estratégia de gestão de templates via interface de Super Admin com metadados de marketing. |
| 19/04/2026 | Implementação completa da **Visibilidade por Time (RF010)**. Filtros automáticos adicionados aos repositórios e casos de uso de WorkItems. Adicionada dependência de segurança para validar `role` e `team_id` via DB. Controle de acesso aplicado a Board, Listagens, Busca, Histórico e Vínculos. |
| 19/04/2026 | Implementação completa da **Vinculação entre WorkItems (RF021)**. Adicionada tabela `work_item_links`, repositório, caso de uso com registro de histórico bidirecional e nova interface no frontend (WorkItemLinksPanel) integrada ao modal de detalhes. Adicionado também endpoint de busca global por título. |
| 17/04/2026 | Auditoria completa do código-fonte. Atualização massiva de status: RF004, RF005, RF009, RF011, RF012, RF013, RF014, RF015, RF016, RF022 marcados como **Concluído**. RF007 reclassificado para **Em Andamento** (tipos de campo `cpf`, `cep`, `phone` existem no backend, falta implementar máscaras de input no frontend). Adicionada seção de Arquitetura Técnica Implementada. Roadmap atualizado. |
| 05/04/2026 | Criação inicial do PRD e sessão de brainstorming. |
