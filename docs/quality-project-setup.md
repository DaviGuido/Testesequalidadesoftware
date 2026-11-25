# Ambiente de testes do Projeto Integrado P2

Este documento descreve como preparar o Full-Stack E-Commerce App para o trabalho de Testes e Qualidade de Software.

## Pré-requisitos

- Node.js 22 ou superior e npm.
- PostgreSQL acessível localmente ou uma instância exclusiva para testes.
- Git e um navegador atualizado.
- Para os testes de interface: Selenium WebDriver e navegador/driver compatíveis (a configurar na etapa de automação de interface).

## Segurança do ambiente

**Não execute a suíte de testes contra banco de produção ou banco com dados reais.** A suíte `test/smoke.test.js` cria e remove usuários, produtos e pedidos. Utilize um banco descartável, por exemplo `ecommerce_test`, com dados fictícios.

Crie um banco PostgreSQL separado para o grupo. Não use credenciais reais no repositório. O segredo JWT abaixo é apenas ilustrativo e deve ser exclusivo do ambiente de teste.

## Configuração do backend

1. Copie `.env.example` para `.env`.
2. Ajuste `DATABASE_URL` para o banco exclusivo de testes. Para PostgreSQL local, um exemplo é:

   ```env
   DATABASE_URL=postgresql://postgres:SENHA_LOCAL@localhost:5432/ecommerce_test
   ```

   Para banco hospedado que exija TLS, mantenha o parâmetro `sslmode=require` fornecido pelo provedor.
3. Defina um `JWT_SECRET` aleatório e exclusivo para testes.
4. Não configure chaves reais do Stripe ou Google. Para os testes que dependem de integrações externas, use credenciais de teste ou simulações aprovadas pelo professor.
5. Instale as dependências na raiz:

   ```bash
   npm ci
   ```
6. Crie as tabelas:

   ```bash
   npm run db:schema
   ```
7. Execute a suíte existente:

   ```bash
   npm test
   ```

Registre a data, o commit testado, o ambiente, o comando e a saída integral. Um teste só deve ser marcado como aprovado/reprovado após execução real.

## Configuração do frontend

1. Copie `client/.env.example` para `client/.env`.
2. Confirme que `VITE_API_BASE_URL` aponta para a API local, normalmente `http://localhost:4001`.
3. Instale as dependências:

   ```bash
   npm ci --prefix client
   ```
4. Em um terminal, inicie o backend:

   ```bash
   npm run dev
   ```
5. Em outro terminal, inicie o frontend:

   ```bash
   npm run dev --prefix client
   ```
6. Acesse `http://localhost:5173` e verifique os fluxos com uma conta e dados fictícios.

## Verificações complementares

```bash
npm run build --prefix client
npm run lint --prefix client
```

A documentação da API fica em `docs/openapi.yaml` e, com o backend em execução, a interface Swagger fica disponível em `http://localhost:4001/api-docs/`.

## CI/CD

O workflow `.github/workflows/quality.yml` prepara um PostgreSQL descartável no runner, instala as dependências, aplica o esquema, executa a suíte atual, constrói o frontend e roda o linter. O workflow está **configurado no código**, mas só poderá ser considerado validado depois de ser enviado ao GitHub e apresentar uma execução concluída com evidências.

## Limitações conhecidas nesta fase

- A suíte de backend atual é uma suíte de smoke/integration test com Mocha, Chai e Supertest; ela não substitui os seis testes unitários, os cinco cenários de integração organizados, nem os quatro testes Selenium exigidos pelo P2.
- O conjunto de testes existente pode deixar dados de teste no banco caso uma execução seja interrompida antes das rotinas de limpeza. Por isso, utilize um banco descartável e verifique seu estado entre execuções.
- Ainda não foram produzidas evidências de execução local nesta fase. Os resultados devem ser registrados somente depois da execução real no ambiente do grupo.
