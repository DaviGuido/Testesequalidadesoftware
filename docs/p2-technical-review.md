# Análise técnica inicial para o Projeto Integrado P2

## Sistema analisado

Full-Stack E-Commerce App — React/Vite no frontend, Node.js/Express no backend e PostgreSQL na persistência. A aplicação contempla autenticação, catálogo de produtos, carrinho, pedidos e fluxo de pagamento com Stripe.

## Estado do repositório recebido

- Node.js exigido pelo `package.json`: versão 22 ou superior.
- O script `npm test` executa Mocha em `test/**/*.test.js`.
- A suíte `test/smoke.test.js` contém 40 testes `it(...)` escritos com Mocha, Chai e Supertest.
- O frontend possui scripts de desenvolvimento, build e lint.
- O repositório recebido não continha `.github/workflows`; foi criado um workflow inicial de CI em `.github/workflows/quality.yml`.
- A API possui especificação OpenAPI em `docs/openapi.yaml`.

## Ajuste necessário na documentação de requisitos

A tela de cadastro (`client/src/pages/RegisterPage.jsx`) apresenta os campos e-mail, senha e confirmação de senha. O backend (`routes/auth.routes.js`) recebe e-mail e senha e preenche `username` com o próprio e-mail. Portanto, não devemos descrever o nome de usuário como um campo informado pelo usuário no cadastro. A confirmação de senha é validada no frontend e não é enviada ao backend.

## Pontos de atenção para testes e qualidade

### Autorização de usuários

Em `routes/users.routes.js`, as operações GET de listagem, GET por ID, PUT e DELETE exigem autenticação, mas não verificam se o usuário autenticado é o proprietário do recurso nem verificam um papel administrativo. Em `routes/orders.routes.js`, as operações GET de todos os pedidos, GET por ID, PUT e DELETE também exigem autenticação sem uma verificação explícita de propriedade. O próprio README descreve a ausência de autorização baseada em papéis nas rotas administrativas.

Isso deve ser tratado como risco/hipótese de defeito de autorização e validado com duas contas fictícias em banco de testes. Não registrar como defeito confirmado antes de reproduzir o comportamento e comparar com o requisito aprovado pelo professor.

### Quantidade de estoque igual a zero

Em `routes/products.routes.js`, `inventoryQuantity` é obtido por meio de `req.body.inventoryQuantity || req.body.inventory_quantity`. Como zero é um valor falsy em JavaScript, o valor zero pode ser tratado como se estivesse ausente. Criar casos de fronteira para criação e atualização de produto com estoque zero e verificar o comportamento real.

### Validação de entradas e integridade

A tabela `products` impõe preço e estoque não negativos. Os testes devem verificar entradas inválidas e observar se a API responde com erro de validação adequado, sem assumir previamente o status HTTP que será obtido. O carrinho exige quantidade maior que zero; também devem ser verificadas quantidades fracionárias, textos e valores extremos.

### Isolamento dos testes

A suíte automatizada cria e remove dados no banco. Todas as execuções devem usar um banco PostgreSQL exclusivo e descartável do grupo. Nunca apontar `DATABASE_URL` para produção, homologação compartilhada ou banco com dados reais.

## Alterações técnicas incluídas nesta cópia

1. `db/index.js`: remove a imposição de TLS para todo banco. A conexão passa a respeitar o `sslmode` da URL. Isso permite PostgreSQL local sem TLS e mantém a possibilidade de TLS ao usar uma URL de provedor com `sslmode=require`.
2. `.github/workflows/quality.yml`: pipeline inicial com PostgreSQL temporário, instalação de dependências, aplicação do schema, testes atuais de backend, build do frontend e lint.
3. `docs/quality-project-setup.md`: guia de configuração local, segurança do ambiente de teste e execução.
4. `.env.example`: orientação para URL local e banco hospedado com TLS.

## O que ainda não foi validado

A instalação de dependências não foi concluída neste ambiente porque o acesso ao registro npm falhou por resolução DNS (`EAI_AGAIN`) e a tentativa expirou. Não há PostgreSQL nem Docker disponíveis neste ambiente. Por isso, não foram executados `npm test`, `npm run db:schema`, build, lint, Selenium ou Postman. O workflow foi escrito, mas só será considerado validado depois de ser enviado ao GitHub e apresentar uma execução real.

## Próxima sequência recomendada

1. Criar um fork do repositório para o grupo.
2. Aplicar as alterações desta cópia ao fork.
3. Preparar PostgreSQL exclusivo de testes e variáveis locais.
4. Executar a suíte atual e guardar saída, data e commit.
5. Reproduzir os cenários de autorização e estoque zero.
6. Implementar testes unitários, testes adicionais de API e Selenium.
7. Realizar a evolução por TDD em commits separados Red, Green e Refactor.
8. Executar CI/CD e as análises de qualidade, preservando as evidências.
