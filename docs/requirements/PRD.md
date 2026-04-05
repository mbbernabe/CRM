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
| RF006 | **Captura de Leads**: API/Webhook para integração com WhatsApp/IG/FB. | P2 (Média) | Pendente |
| RF007 | **Tipos Complexos & Máscaras**: CPF, CNPJ e Telefone com validação e formatação automática. | P1 (Alta) | Pendente |
| RF008 | **Interdependência de Campos**: Autopreenchimento (CEP preenche endereço) e cálculos dinâmicos. | P2 (Média) | Pendente |
| RF009 | **Recuperação de Senha**: Fluxo seguro de redefinição de senha via e-mail com tokens expiráveis. | **P1 (Alta)** | **Pendente** |
| RF011 | **Pipelines Genéricas (Workflow)**: Motor de estados que permite que qualquer entidade (Contato, Empresa, Negócio, Ticket) percorra fluxos de status customizáveis. | **P1 (Alta)** | **Planejado** |

---

## 3. Requisitos Não Funcionais (RNF)
- **Escalabilidade**: Arquitetura pronta para milhares de tenants.
- **Segurança**: Criptografia de dados sensíveis e isolamento estrito: `Workspace` isola a base e `Team` isola a visibilidade dos registros.
- **Usabilidade**: Interface intuitiva para configuração de fluxos complexos.

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

---

## 6. Métricas de Sucesso
- Adoção de pipelines customizadas por > 80% dos usuários.
- Redução no tempo de entrada de leads via automação.
