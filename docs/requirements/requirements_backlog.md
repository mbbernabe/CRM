# Backlog de Requisitos & Brainstorming

## ⚡ Integrações Externas (Leads Automáticos)
- [ ] **WhatsApp**: Webhook para receber mensagens e criar contatos.
- [ ] **Instagram Direct**: Integração via API do Meta para capturar leads de DMs.
- [ ] **Facebook Lead Ads**: Conexão direta para importar formulários de anúncios.
- [ ] **E-mail (SMTP/IMAP)**: Monitoramento de caixa de entrada para novos leads.

---

## 👥 Gestão de Times & Colaboração
- [ ] **Múltiplos Times**: Um usuário pode criar ou ser membro de diversos times.
- [ ] **Convites via E-mail**: Fluxo de convite para novos membros com expiração.
- [ ] **Papéis (Roles)**: Diferenciação entre Dono do Time, Administrador e Membro.
- [ ] **Isolamento de Dados**: Garantir que as propriedades customizadas de um time não apareçam em outro.
- [ ] **Validação & Máscaras**: Tipos específicos para CPF, CNPJ, Telefone e E-mail com validação e formatação automática.
- [ ] **Lógica Inter-propriedades**: Autopreenchimento (ex: CEP preenche Logradouro/Cidade/UF) e cálculos entre campos.

## 📅 Notas de Brainstorming [03/04/2026]
- **Visão**: O CRM deve ser um SaaS para pessoas e times organizarem Atividades Empresariais (Marketing, Fluxo de Clientes, Produção).
- **Prioridade 1**: **Flexibilidade nas Propriedades** (Custom Fields) é a base de tudo agora.
- **Próximos Passos**: 
    1.  Definição técnica da arquitetura de Propriedades Dinâmicas.
    2.  Análise de sistema de Pipelines e Transições.
    3.  Planejamento de Isolação de Dados (Multi-tenancy).

---

## 📅 Ideias & Hipóteses
- **Hipótese de Automação**: Se definirmos uma "Pipeline de Entrada" padrão por integração, o usuário reduz o tempo de triagem em 50%.
- **Métrica**: Tempo médio de resposta ao Lead (Lead Response Time).
- **UX Idea**: Propriedades complexas (CPF/Fone) devem ter "input masks" para evitar erros de digitação e melhorar a qualidade dos dados.
- **Automation Idea**: A integração com APIs de CEP (como ViaCEP) economiza 30-40 segundos por cadastro de endereço.

---

## 🗑️ Requisitos Arquivados
- *Nenhum no momento.*
