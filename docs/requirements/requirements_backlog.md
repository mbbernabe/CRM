# Backlog de Requisitos & Brainstorming

## ⚡ Integrações Externas (Leads Automáticos)
- [ ] **API de Entrada (Leads Inbound)**: Endpoint(s) de API pública configurável para recebimento direto de leads originados de websites, landing pages ou outros sistemas externos.
- [ ] **WhatsApp**: Webhook para receber mensagens e criar contatos.
- [ ] **Instagram Direct**: Integração via API do Meta para capturar leads de DMs.
- [ ] **Facebook Lead Ads**: Conexão direta para importar formulários de anúncios.
- [ ] **E-mail (SMTP/IMAP)**: Monitoramento de caixa de entrada para novos leads.

---

## 🏢 Gestão de Áreas de Trabalho (Workspaces) & Times
- [ ] **Biblioteca de Modelos (Super Admin)**: O Super Admin poderá criar e configurar tipos de objetos e campos personalizados em uma biblioteca global. Administradores de Workspace podem escolher e importar (clonar) esses modelos para suas áreas, permitindo personalização local sem afetar o modelo global.
- [ ] **Configuração de SMTP por Workspace**: Deve existir uma configuração de SMTP isolada para cada Área de Trabalho. Somente o Administrador do Workspace terá permissão para gerenciar essas credenciais.
- [x] **Workspaces**: A Área de Trabalho é o tenant principal. Todo dado pertence a um Workspace.
- [x] **Múltiplos Times por Workspace**: Um Workspace pode conter diversos times (ex: Vendas, RH, Financeiro).
- [x] **Associação de Usuário**: Usuários podem ser membros de múltiplos Workspaces e múltiplos Times.
- [x] **Isolamento de Dados**: `Workspace` isola a base global e `Team` isola a visibilidade (Usuários veem apenas o que o Time possui).
- [x] **Sistema de Convites**: Fluxo para convidar usuários para o Workspace e dar acesso a times específicos.
- [ ] **Validação & Máscaras**: Tipos específicos para CPF, CNPJ, Telefone e E-mail com validação e formatação automática.
- [ ] **Lógica Inter-propriedades**: Autopreenchimento (ex: CEP preenche Logradouro/Cidade/UF) e cálculos entre campos.
- [ ] **Recuperação de Senha (RF009)**: Link "Esqueci minha senha", envio de e-mail com token temporário e tela de definição de nova senha.
- [ ] **Responsividade Premium**: Implementar e validar adaptabilidade em todas as telas existentes e futuras (Mobile/Tablet/Desktop).

## 📋 Gestão de WorkItems & Atividades
- [x] **Dono do WorkItem**: Todo WorkItem pode ter um usuário dono atribuído.
- [x] **Histórico de Ações**: Todas as ações em um WorkItem devem ser registradas em atividades.
- [x] **Observações/Notas**: O usuário poderá criar observações que também serão registradas em atividades no WorkItem.
- [ ] **Vinculação entre WorkItems (RF021)**: Um WorkItem pode ser vinculado a um ou mais outros WorkItems.
  - Na visualização do WorkItem, os vínculos devem ser exibidos em uma seção dedicada, **agrupados por tipo** (ex: "🧑 Contatos (2)", "💼 Negócios (1)", "🎫 Tickets (3)").
  - O usuário pode pesquisar e adicionar vínculos através de um seletor com busca por nome/título.
  - O usuário pode remover vínculos existentes individualmente.
  - A relação é **bidirecional**: ao vincular A→B, B exibe A automaticamente em sua lista de vínculos.
  - Todo vínculo é isolado por `workspace_id` e registrado no histórico de atividades do WorkItem.

## 💲 Gestão de Planos & Assinaturas (SaaS)
- [ ] **Criação de Planos (Super Admin)**: O Super Administrador poderá criar planos de assinatura personalizados aplicáveis às Áreas de Trabalho.
- [ ] **Precificação e Limites**: Cada plano pode ter preços exclusivos, além de limites de uso (ex: usuários máximos) e configurações de permissões de módulos habilitados.

## 📅 Notas de Brainstorming [05/04/2026]
- **Visão**: O CRM deve ser um SaaS para pessoas e times organizarem Atividades Empresariais (Marketing, Fluxo de Clientes, Produção).
- **Conquista**: Arquitetura Multi-tenant (Workspaces) implementada com sucesso no Backend e Frontend.
- **Próximos Passos Sugeridos**: 
    1.  **Refinamento de UI**: Implementar seletor/troca de Workspace para o usuário logado.
    2.  **Configurações de Workspace**: Permitir upload de Logo, personalização de cores e nome da empresa.
    3.  **Convites (Teams/Workspace)**: Desenvolver o fluxo de captura de convidados para novos membros.
    4.  **Projeto de Pipelines Genéricas**: Iniciar a migração das pipelines para serem totalmente agnósticas à entidade.

---

## 📅 Ideias & Hipóteses
- **Hipótese de Automação**: Se definirmos uma "Pipeline de Entrada" padrão por integração, o usuário reduz o tempo de triagem em 50%.
- **Métrica de Sucesso**: Tempo médio de resposta ao Lead (Lead Response Time).
- **Modelo de Visibilidade (Team-scoped)**: Implementar filtragem obrigatória de registros por `team_id` em todas as queries de listagem de contatos e negócios.
- **UX Idea**: Propriedades complexas (CPF/Fone) devem ter "input masks" para evitar erros de digitação e melhorar a qualidade dos dados.
- **Automation Idea**: A integração com APIs de CEP (como ViaCEP) economiza 30-40 segundos por cadastro de endereço.

---

## 🗑️ Requisitos Arquivados
- *Nenhum no momento.*
