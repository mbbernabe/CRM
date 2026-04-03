# Product Requirements Document (PRD) - CRM SaaS Modular

## 1. Visão Geral
Sistema de Operação de Negócios (SaaS) modular para indivíduos e times organizarem suas atividades empresariais, gerenciando fluxos de clientes (CRM), marketing, produção e integração com plataformas externas.

### 1.1 Objetivos
- [ ] **Multi-tenancy**: Isolamento completo de dados por organização.
- [ ] **Flexibilidade Total**: Usuários definem suas próprias propriedades (campos customizados).
- [ ] **Múltiplos Fluxos**: Suporte a várias pipelines configuráveis (Vendas, Marketing, Produção).
- [ ] **Integrações Nativa**: Captura automática de leads via WhatsApp, IG, FB e E-mail.
- [ ] **Segurança**: Autenticação moderna e segura (OAuth2/JWT).

### 1.2 Público-Alvo (Personas)
- **Empreendedor Individual**: Organização pessoal e automação de leads.
- **Equipes de Vendas/Marketing**: Colaboração em pipelines e gestão de contatos.
- **Gerentes de Produção**: Acompanhamento de fluxos de trabalho internos.

---

## 2. Requisitos Funcionais (RF)
| ID | Descrição | Prioridade | Status |
|----|-----------|------------|--------|
| RF001 | **Propriedades Dinâmicas**: Gerenciamento de metadados (Seleção, Moeda, Múltiplas Linhas, etc). | **P0 (Crítica)** | Em Desenvolvimento |
| RF002 | **Multi-tenancy (Isolamento)**: Adicionar `tenant_id` em todas as entidades. | **P0 (Crítica)** | Planejado |
| RF003 | **Gestão de Times**: Criar múltiplos times por usuário e convidar novos membros. | **P1 (Alta)** | Em Definição |
| RF004 | **Gestão de Pipelines**: Criar múltiplas pipelines com etapas customizáveis. | P1 (Alta) | Pendente |
| RF005 | **Autenticação**: Login seguro e gestão de permissões de times. | P1 (Alta) | Pendente |
| RF006 | **Captura de Leads**: API/Webhook para integração com WhatsApp/IG/FB. | P2 (Média) | Pendente |
| RF007 | **Tipos Complexos & Máscaras**: CPF, CNPJ e Telefone com validação e formatação automática. | P1 (Alta) | Pendente |
| RF008 | **Interdependência de Campos**: Autopreenchimento (CEP preenche endereço) e cálculos dinâmicos. | P2 (Média) | Pendente |

---

## 3. Requisitos Não Funcionais (RNF)
- **Escalabilidade**: Arquitetura pronta para milhares de tenants.
- **Segurança**: Criptografia de dados sensíveis e isolamento de banco (Row Level Security ou similar).
- **Usabilidade**: Interface intuitiva para configuração de fluxos complexos.

---

## 4. Roadmap Modular (Ordem de Construção)
1.  **Módulo de Propriedades Dinâmicas**: Refinamento e UI de gestão.
2.  **Módulo de Gestão de Times & Auth**: Estrutura de Users, Teams, Invites e Tenancy.
3.  **Módulo de Fluxos (Pipelines)**: Estruturação de estágios e transições.
4.  **Módulo de Integrações externas**: Webhooks e conectores sociais.

---

## 5. User Stories (Exemplos Iniciais)
- **Como** gestor, **eu quero** criar uma propriedade "Data de Renovação" nos meus contatos **para que** eu possa filtrar clientes próximos ao vencimento.
- **Como** vendedor, **eu quero** que leads vindos do WhatsApp caiam na pipeline "Entrada" automaticamente **para que** eu não perca tempo em cadastros manuais.
- **Como** atendente, **eu quero** que ao digitar o CEP, os campos de endereço sejam preenchidos **para que** eu minimize o erro humano e agilize o atendimento.

---

## 6. Métricas de Sucesso
- Adoção de pipelines customizadas por > 80% dos usuários.
- Redução no tempo de entrada de leads via automação.
