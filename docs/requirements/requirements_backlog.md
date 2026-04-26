# Backlog de Requisitos & Brainstorming

## ⚡ Integrações Externas (Leads Automáticos)
- [ ] **API de Entrada (Leads Inbound)**: Endpoint(s) de API pública configurável para recebimento direto de leads originados de websites, landing pages ou outros sistemas externos.
- [ ] **WhatsApp**: Webhook para receber mensagens e criar contatos.
- [ ] **Instagram Direct**: Integração via API do Meta para capturar leads de DMs.
- [ ] **Facebook Lead Ads**: Conexão direta para importar formulários de anúncios.
- [ ] **E-mail (SMTP/IMAP)**: Monitoramento de caixa de entrada para novos leads.

---

## 🏢 Gestão de Áreas de Trabalho (Workspaces) & Times
- [x] **Workspaces**: A Área de Trabalho é o tenant principal. Todo dado pertence a um Workspace. *(Backend: `WorkspaceModel`, Frontend: `WorkspaceSettings.jsx`)*
- [x] **Múltiplos Times por Workspace**: Um Workspace pode conter diversos times (ex: Vendas, RH, Financeiro). *(Backend: `teams.py` routes, Frontend: `WorkspaceMembers.jsx`)*
- [x] **Associação de Usuário**: Usuários podem ser membros de múltiplos Workspaces e múltiplos Times. *(Backend: `UserModel.team_id`, `UserModel.workspace_id`)*
- [x] **Isolamento de Dados**: `Workspace` isola a base global e `Team` isola a visibilidade. *(Backend: `workspace_id` presente em todas as entidades)*
- [x] **Sistema de Convites**: Fluxo completo — enviar, validar token, aceitar (cria usuário), cancelar. Envio de e-mail por SMTP com link. Painel de gestão no frontend. *(Backend: `invitations.py`, `invitation_use_case.py`, Frontend: `WorkspaceMembers.jsx`, `AcceptInvite.jsx`)*
- [x] **Configuração de Workspace**: Personalização de nome, logo, cores (primária/acento), dias de expiração e mensagem de convite. *(Backend: `WorkspaceModel`, Frontend: `WorkspaceSettings.jsx`)*
- [x] **Biblioteca de Modelos (Super Admin)**: CRUD completo de Templates globais + importação massiva de campos. *(Backend: `admin.py` routes, Frontend: `AdminTemplates.jsx`)*
- [x] **Pool de Campos Sugeridos**: Campos com `is_default=False` no modelo global ficam disponíveis para importação sob demanda pelo Admin do Workspace. Inclui verificação de atualizações e sincronização. *(Backend: `list_suggested_fields`, `import_global_field`, `check_for_updates`, `sync_from_global`)*
- [x] **Configuração de SMTP por Workspace (RF017)**: Deve existir uma configuração de SMTP **isolada por Workspace**. Atualmente, SMTP é configurado globalmente em `system_settings`. Necessário migrar para modelo por workspace. *(Implementado: WorkspaceModel, WorkspaceSettings.jsx, EmailService)*
- [ ] **Validação & Máscaras de Input (Frontend)**: Os tipos `cpf`, `cep`, `phone` já existem no backend (`FieldType` enum). Falta implementar as input masks e formatação automática nos inputs do frontend.
- [ ] **Lógica Inter-propriedades**: Autopreenchimento (ex: CEP preenche Logradouro/Cidade/UF) e cálculos entre campos.
- [ ] **Responsividade Premium**: ~~Implementar e validar adaptabilidade em todas as telas existentes e futuras (Mobile/Tablet/Desktop).~~ ✅ Implementado — Sidebar colapsável, mobile header com hamburger, overlay.

## 🎨 Modernização UI/UX (Módulos & Onboarding)
- [ ] **Onboarding Inteligente (Empty State)**: Substituir a mensagem de "vazio" por cards visuais de templates populares (Vendas, RH, Suporte).
- [ ] **Instalação em 1 Clique**: Ao clicar em um template da vitrine, o sistema deve provisionar o objeto e suas pipelines automaticamente.
- [ ] **Editor Visual com Live Preview**: Redesenhar o builder de campos para incluir um painel de visualização em tempo real de como o formulário ficará.
- [ ] **Progressive Disclosure**: Reorganizar as telas de configuração para ocultar complexidade técnica (IDs internos, grupos complexos) em seções "Avançadas".
- [ ] **Painel Administrativo de Templates (Super Admin)**: Criar interface para que o dono do SaaS possa configurar os modelos globais com metadados de marketing (descrição, categorias, ícones premium).

## 🏠 Página Inicial Personalizável (Home - RF032/RF033)
- [ ] **Novo Dashboard Operacional (Home)**: Criar a tela `Home.jsx` como novo entrypoint do sistema.
- [ ] **Sistema de Widgets (Grid)**: Implementar layout de grid para os cards de atalho.
- [ ] **Widgets Iniciais (MVP)**:
    - **Ações Rápidas**: "Nova Tarefa", "Novo Contato", "Novo Negócio".
    - **Resumo do Dia**: Contador de tarefas vencidas e hoje.
    - **Itens Recentes**: Carrossel ou lista dos últimos 5 itens acessados.
    - **Atalhos de Pipeline**: Links diretos para os quadros Kanban mais usados.
- [ ] **Personalização de Layout**:
    - Botão "Editar Home" que entra em modo de edição.
    - Drag-and-drop para reordenar widgets.
    - Toggle para esconder/mostrar widgets específicos.
- [ ] **Biblioteca de Cards (Widgets)**: Menu lateral (Drawer) permitindo ao usuário visualizar um catálogo de cards disponíveis para compor sua Home. Deve ser construído de forma expansível para fácil adição de novos widgets no futuro.
- [ ] **Persistência de Preferências**: Salvar o JSON de configuração no campo `preferences` do `UserModel`.

## 🌐 Funcionalidades Globais (Cross-Workspace)
- [ ] **Calendário Unificado**: Uma visão global que agrega tarefas e compromissos de *todas* as Áreas de Trabalho que o usuário pertence em um único painel.
- [ ] **Caixa de Entrada/Mensagens Unificada**: Painel central para o usuário visualizar notificações, menções e mensagens advindas de diversos Workspaces.
- [ ] **Mensageria P2P (Direct Messages)**: Chat interno permitindo que os usuários troquem mensagens diretas entre si.

## 🎯 Produtividade & Tarefas (My Tasks Center)
- [x] **Provisionamento Mandatório de Tarefas (RF026)**: Ao criar um novo Workspace, o sistema deve injetar automaticamente o `WorkItemType` "Tarefa" e uma pipeline de 3 estágios (A fazer, Fazendo, Feito).
- [x] **Central "Minhas Tarefas" (Dashboard) (RF027)**: Uma visão consolidada onde o usuário vê apenas suas tarefas, agrupadas por:
    - **🚨 Vencidas**: Destaque visual crítico para o que passou do prazo.
    - **📅 Hoje**: Foco no trabalho imediato.
    - **📝 Sem Data / Backlog**: Tarefas que ainda precisam de agendamento.
    - **🌟 Importantes**: Tarefas marcadas com prioridade alta.
    - **📅 Planejadas**: Tarefas com prazos futuros.
- [x] **Visualização em Calendário (RF031)**: Interface visual para planejamento temporal.
    - **Mês/Semana**: Alternância entre visualizações.
    - **Drag-to-resize**: Redimensionamento de tarefas multi-dia.
    - **Context Menu**: Criação de tarefas via clique direito no calendário.
    - **Sincronização**: Persistência automática de datas no backend.
- [ ] **Widget de Acesso Rápido**: Mini-lista de tarefas acessível no Header ou Sidebar para consulta rápida de qualquer tela.
- [ ] **Vinculação Contextual**: Garantir que toda tarefa possa ser vinculada a um Contato, Negócio ou Empresa com facilidade (usando RF021).
- [x] **Dono do WorkItem**: Todo WorkItem pode ter um usuário dono atribuído. *(Backend: `owner_id` em `WorkItemModel`, Frontend: `AssignWorkItemModal.jsx`, `WorkItemCard.jsx` com avatar)*
- [x] **Histórico de Ações**: Todas as ações em um WorkItem são registradas em atividades automaticamente (criação, movimentação, edição de campos, atribuição). *(Backend: `ManageWorkItemHistoryUseCase`, Frontend: `WorkItemHistoryPanel.jsx`)*
- [x] **Observações/Notas**: O usuário pode criar observações que são registradas no histórico. *(Backend: `POST /{item_id}/notes`, Frontend: `WorkItemHistoryPanel.jsx`)*
- [x] **Vinculação entre WorkItems (RF021)**: Um WorkItem pode ser vinculado a um ou mais outros WorkItems. *(Backend: `WorkItemLinkModel`, `ManageWorkItemLinksUseCase`, Frontend: `WorkItemLinksPanel.jsx`)*
  - [x] Na visualização do WorkItem, os vínculos devem ser exibidos em uma seção dedicada, **agrupados por tipo** (ex: "🧑 Contatos (2)", "💼 Negócios (1)", "🎫 Tickets (3)").
  - [x] O usuário pode pesquisar e adicionar vínculos através de um seletor com busca por nome/título.
  - [x] O usuário pode remover vínculos existentes individualmente.
  - [x] A relação é **bidirecional**: ao vincular A→B, B exibe A automaticamente em sua lista de vínculos.
  - [x] Todo vínculo é isolado por `workspace_id` e registrado no histórico de atividades do WorkItem.

## 🔧 Gestão de Pipelines & Tipos de Objetos
- [x] **CRUD de Pipelines**: Criar, editar (nome + estágios com ordem/cor/finalidade), excluir pipelines por workspace. *(Backend: `pipelines.py`, Frontend: `PipelineSettings.jsx`)*
- [x] **Pipelines Globais (Super Admin)**: Templates de pipeline vinculados a `WorkItemType` global, importáveis pelo Workspace. *(Backend: `list_templates`, `import_from_template`)*
- [x] **CRUD de Tipos de Objetos**: Criar, editar (label, ícone, cor), excluir tipos de objetos por workspace. Campos customizados com grupos e ordenação. *(Backend: `work_item_routes.py`, Frontend: `WorkItemTypeSettings.jsx`)*
- [x] **Quadro Kanban Dinâmico**: Quadro de Pipeline com drag-and-drop por tipo de objeto, exibindo cards com propriedades dinâmicas. *(Frontend: `PipelineBoardScreen.jsx`, `WorkItemBoard.jsx`)*
- [x] **Tela Genérica de Entidades**: Tela que se adapta dinamicamente ao tipo de objeto selecionado na sidebar. *(Frontend: `GenericEntityScreen.jsx`)*

## 🔐 Autenticação & Segurança
- [x] **Login**: Autenticação com e-mail e senha. *(Backend: `LoginUseCase`, Frontend: `Login.jsx`)*
- [x] **Registro**: Criação de conta com nome, e-mail, senha e nome do Workspace. Cria automaticamente o Workspace, Time "Geral" e o primeiro usuário admin. *(Backend: `RegisterUserUseCase`, Frontend: `Register.jsx`)*
- [x] **Recuperação de Senha**: Fluxo completo — tela "Esqueci minha senha", envio de e-mail com token JWT, tela de redefinição. *(Backend: `password_reset_use_case.py`, Frontend: `ForgotPassword.jsx`, `ResetPassword.jsx`)*
- [x] **Configurações Globais (SMTP)**: Tela de SuperAdmin para configurar servidor SMTP, credenciais, URL base de reset. *(Backend: `admin_settings.py`, Frontend: `SystemSettings.jsx`)*
- [x] **Perfil do Usuário & Ativação (Onboarding)**: Interface dedicada para o usuário ativar seu perfil, fazer upload de uma imagem (Avatar), e complementar informações como telefone, WhatsApp e cargo para identificação no sistema. *(Backend: `profile_use_cases.py`, Frontend: `Profile.jsx`)*
- [x] **Alteração de Senha (Logado)**: Funcionalidade nas configurações de perfil para o usuário autenticado redefinir sua senha. Deve exigir a confirmação da senha atual por questões de segurança. *(Backend: `ChangePasswordUseCase`, Frontend: `Profile.jsx`)*

## 💲 Gestão de Planos & Assinaturas (SaaS)
- [ ] **Criação de Planos (Super Admin)**: O Super Administrador poderá criar planos de assinatura personalizados aplicáveis às Áreas de Trabalho.
- [ ] **Precificação e Limites**: Cada plano pode ter preços exclusivos, além de limites de uso (ex: usuários máximos) e configurações de permissões de módulos habilitados.

## 📅 Notas de Brainstorming [05/04/2026]
- **Visão**: O CRM deve ser um SaaS para pessoas e times organizarem Atividades Empresariais (Marketing, Fluxo de Clientes, Produção).
- **Conquista**: Arquitetura Multi-tenant (Workspaces) implementada com sucesso no Backend e Frontend.
- **Próximos Passos Sugeridos**: 
    1.  ~~**Refinamento de UI**: Implementar seletor/troca de Workspace para o usuário logado.~~ ✅
    2.  ~~**Configurações de Workspace**: Permitir upload de Logo, personalização de cores e nome da empresa.~~ ✅
    3.  ~~**Convites (Teams/Workspace)**: Desenvolver o fluxo de captura de convidados para novos membros.~~ ✅
    4.  ~~**Projeto de Pipelines Genéricas**: Iniciar a migração das pipelines para serem totalmente agnósticas à entidade.~~ ✅

## 📅 Notas de Brainstorming [17/04/2026]
- **Conquistas Recentes**: Pipelines genéricas, Biblioteca de Modelos com Campos Sugeridos, Fluxo de Convites completo, Quadro Kanban dinâmico com atribuição de dono, histórico de atividades e **Vinculação bidirecional entre WorkItems**.
- **Próximos Passos Sugeridos**:
    1.  **Input Masks no Frontend (RF007)**: Implementar formatação automática nos inputs de CPF, CNPJ, Telefone e CEP.
    2.  ~~**SMTP por Workspace (RF017)**: Migrar configuração de SMTP de global para por workspace.~~ ✅
    3.  **Visibilidade por Time (RF010)**: Implementar filtro automático de registros por `team_id`.
    4.  ~~**API Pública para Leads (RF019)**: Criar endpoints configuráveis e seguros para ingestão de leads externos.~~ ✅

---

## 📅 Notas de Brainstorming [20/04/2026]
- **Conquista Recente**: Implementação da **Central de Tarefas (RF027)**, **Calendário (RF031)** e **Módulo de Perfil e Segurança (RF028/RF029)** com suporte a avatar, cargo e alteração segura de senha.
- **Pendência Importante**: Atualizar os dados de contato (Chat/Telefone) na `DeactivatedScreen.jsx`. Atualmente estão com placeholders ("0800 123 4567").

---

## 📅 Notas de Brainstorming [26/04/2026]
- **Home Personalizável (Refinamento)**: A funcionalidade de personalização foi muito bem recebida. O próximo passo é criar uma "Biblioteca de Cards", um menu lateral onde o usuário possa escolher quais widgets deseja arrastar/adicionar na sua Home. **Ação:** Manter atenção constante durante o desenvolvimento para identificar novos "cards" em potencial que agreguem valor à Home.
- **Ecossistema Unificado (Cross-Workspace)**: Como a Home é o ambiente principal e "acima" do Workspace logado, é o local ideal para features que cruzam as fronteiras do tenant. Foram sugeridas:
    1.  **Calendário Unificado**: Ver tudo (tarefas, reuniões) de todas as empresas ao mesmo tempo.
    2.  **Inbox/Mensagens Unificadas**: Um centralizador de notificações.
    3.  **Chat (P2P)**: Permitir conversas diretas entre os usuários dentro da plataforma.
- **Métricas & NFR**: A Home, agora como agregador Global, precisará ser extremamente rápida. Consultas Cross-Workspace exigirão índices otimizados por `user_id` e cache inteligente para não comprometer a performance (NFR-P003).

---

## 📅 Ideias & Hipóteses
- **Hipótese de Automação**: Se definirmos uma "Pipeline de Entrada" padrão por integração, o usuário reduz o tempo de triagem em 50%.
- **Métrica de Sucesso**: Tempo médio de resposta ao Lead (Lead Response Time).
- **Modelo de Visibilidade (Team-scoped)**: Implementar filtragem obrigatória de registros por `team_id` em todas as queries de listagem de contatos e negócios.
- **UX Idea**: Propriedades complexas (CPF/Fone) devem ter "input masks" para evitar erros de digitação e melhorar a qualidade dos dados.
- **Automation Idea**: A integração com APIs de CEP (como ViaCEP) economiza 30-40 segundos por cadastro de endereço.
- **RBAC Idea**: Migrar de headers manuais (`X-User-Role`) para um sistema de roles/permissions real com JWT claims.
- **Reporting Idea**: Dashboards e relatórios de desempenho segmentados por **Time** (ex: conversão do Time A vs Time B).

---

## 🗑️ Requisitos Arquivados
- *Nenhum no momento.*
