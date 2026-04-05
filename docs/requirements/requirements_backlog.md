# Backlog de Requisitos & Brainstorming

## ⚡ Integrações Externas (Leads Automáticos)
- [ ] **WhatsApp**: Webhook para receber mensagens e criar contatos.
- [ ] **Instagram Direct**: Integração via API do Meta para capturar leads de DMs.
- [ ] **Facebook Lead Ads**: Conexão direta para importar formulários de anúncios.
- [ ] **E-mail (SMTP/IMAP)**: Monitoramento de caixa de entrada para novos leads.

---

## 🏢 Gestão de Áreas de Trabalho (Workspaces) & Times
- [ ] **Workspaces**: A Área de Trabalho é o tenant principal. Todo dado pertence a um Workspace.
- [ ] **Múltiplos Times por Workspace**: Um Workspace pode conter diversos times (ex: Vendas, RH, Financeiro).
- [ ] **Associação de Usuário**: Usuários podem ser membros de múltiplos Workspaces e múltiplos Times.
- [ ] **Sistema de Convites**: Fluxo para convidar usuários para o Workspace e dar acesso a times específicos.
- [ ] **Isolamento de Dados**: `Workspace` isola a base global e `Team` isola a visibilidade (Usuários veem apenas o que o Time possui).
- [ ] **Validação & Máscaras**: Tipos específicos para CPF, CNPJ, Telefone e E-mail com validação e formatação automática.
- [ ] **Lógica Inter-propriedades**: Autopreenchimento (ex: CEP preenche Logradouro/Cidade/UF) e cálculos entre campos.
- [ ] **Recuperação de Senha (RF009)**: Link "Esqueci minha senha", envio de e-mail com token temporário e tela de definição de nova senha.

## 📅 Notas de Brainstorming [03/04/2026]
- **Visão**: O CRM deve ser um SaaS para pessoas e times organizarem Atividades Empresariais (Marketing, Fluxo de Clientes, Produção).
- **Prioridade 1**: **Flexibilidade nas Propriedades** (Custom Fields) é a base de tudo agora.
- **Próximos Passos**: 
    1.  Definição técnica da arquitetura de Propriedades Dinâmicas vinculadas ao Workspace.
    2.  Modelagem da entidade **Workspace** como pai de **Teams**.
    3.  Alteração do fluxo de Registro para capturar 'Nome da Área de Trabalho'.
    4.  **Projeto de Pipelines Genéricas**: Mapear como Contatos, Empresas e Negócios ocuparão 'Stages' de fluxos distintos.

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
