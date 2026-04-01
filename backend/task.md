# Tarefas do Módulo de Melhorias e Vínculos

## 1. Planejamento
- [x] Atualizar `implementation_plan.md` com as novas features
- [x] Obter aprovação do usuário para o design

## 2. Edição do Nome do Grupo
- [x] Backend: Criar rota `PUT /properties/groups/{group_id}` em `properties.py`
- [x] Backend: Atualizar repository e usecase com suporte à edição
- [x] Frontend: Criar UI inline no `PropertySettings.jsx` para renomear grupos ao clicar no ícone de lápis

## 3. Propriedades Compartilhadas
- [x] Backend: Modificar `PropertyDefinitionModel.entity_type` para armazenar múltiplos valores e aceitar filtros LIKE/IN
- [x] Backend: Criar rota `POST /properties/share` ou similar para vincular propriedade existente à nova entidade
- [x] Frontend: Criar botão "Adicionar Existente" em `PropertySettings.jsx`
- [x] Frontend: Criar modal de seleção para importar propriedades da outra entidade (individualmente ou em lote/grupo)

## 4. Vinculação Contato-Empresa (N:N)
- [/] Backend: Criar modelo de associação `CompanyContactLinkModel` em `models.py`
- [ ] Backend: Criar rotas auxiliares (ex: `POST /companies/{id}/contacts/{id}`)
- [ ] Backend: Atualizar as respostas (Use-Cases) para enviar os contatos vinculados
- [ ] Frontend: Criar seções "Empresas Vinculadas" no modal de Contatos (+ seleção)
- [ ] Frontend: Criar seções "Contatos Vinculados" no modal de Empresas (+ seleção)

## 5. Verificação e Qualidade
- [ ] Testar renomeio de grupos no navegador
- [ ] Testar compartilhamento de propriedades de Empresa para Contato e vice-versa
- [ ] Testar vínculo e desvínculo entre contato e empresa
- [ ] Atualizar `walkthrough.md` com vídeos e capturas de tela finais
