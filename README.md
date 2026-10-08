# 💰 Equaliza

<p align="center">
  <strong>Gerencie as finanças da sua família de forma simples, colaborativa e inteligente.</strong>
</p>

<p align="center">
  Aplicação Full Stack desenvolvida com <strong>Next.js</strong>, <strong>Django REST Framework</strong> e <strong>Flutter</strong>.
</p>

---

## 📖 Sobre o projeto

O **Equaliza** é uma plataforma para gerenciamento financeiro familiar que permite que todos os membros de uma família registrem receitas e despesas em um único ambiente, oferecendo uma visão consolidada da situação financeira através de indicadores, gráficos e insights.

A aplicação foi desenvolvida com foco em:

* 🔒 Segurança
* ⚡ Performance
* 📱 Responsividade (web e aplicativo mobile)
* ♻️ Componentização
* 🎯 Boa experiência do usuário

---

# ✨ Funcionalidades

## 👤 Autenticação

* Cadastro de usuários
* Login seguro
* JWT Authentication
* Cookies HttpOnly
* Renovação automática do Access Token (com rotação do Refresh Token)
* Recuperação de senha por e-mail
* Logout

---

## 👨‍👩‍👧‍👦 Famílias

* Criação de famílias
* Alteração da família ativa
* Gerenciamento de membros
* Controle de permissões

Perfis disponíveis:

* 👑 Responsável
* 🛡️ Administrador
* 👤 Membro

---

## ✉️ Convites

* Criação de convites
* Compartilhamento por link
* Aceitação de convite (por usuários novos ou já cadastrados)
* Controle de validade
* Histórico de convites

---

## 💵 Receitas

* Cadastro
* Edição
* Exclusão
* Categorias
* Pesquisa
* Filtros

---

## 💸 Despesas

* Cadastro
* Edição
* Exclusão
* Categorias
* Pesquisa
* Filtros

---

## 🔁 Finanças recorrentes

* Receitas e despesas que se repetem (semanal, mensal ou anual)
* Lançamentos gerados automaticamente quando vencem
* Pausa e data de término

---

## 🏷️ Categorias Financeiras

* Categorias personalizadas
* Categorias de Receita
* Categorias de Despesa

---

## 📊 Dashboard

Indicadores em tempo real:

* Saldo atual
* Total de receitas
* Total de despesas
* Quantidade de membros

Gráficos:

* Receitas × Despesas
* Despesas por categoria
* Contribuição dos membros

Insights sobre as despesas do período (comparação com a média, maiores gastos, tendência, projeção e mais).

Filtros:

* Período
* Categorias

---

## 🤝 Acerto de contas

Cada membro deveria cobrir as despesas do mês na proporção da sua receita (sem receita no mês, a divisão é igual). O acerto mostra quem deve a quem:

* Saldo por membro e sugestões de quem paga quem, calculados no backend (com ids)
* Registro de pagamentos totais ou parciais, feito só pelo devedor; o restante vira "Saldo anterior" no mês seguinte
* Histórico com filtros e estorno (apenas responsável ou administrador), sem apagar o registro
* O saldo conta a partir do mês de início da família (`Family.settlement_start`)
* Acertos não são receitas nem despesas: o app só registra, não move dinheiro

---

## 👤 Perfil

* Alteração do nome
* Escolha de avatar

---

## 📱 Aplicativo mobile

Aplicativo Flutter com as mesmas funcionalidades do web, além de desbloqueio por biometria. Veja o [README do aplicativo](mobile/README.md).

---

# 🛠️ Tecnologias

## Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* TanStack Query
* Axios
* Recharts
* date-fns
* Lucide Icons
* openapi-typescript (tipos gerados a partir do schema da API)

---

## Backend

* Python 3.12
* Django 5
* Django REST Framework
* Django Filter
* Simple JWT
* drf-spectacular (schema OpenAPI)
* PostgreSQL

---

## Mobile

* Flutter
* Dio

---

## DevOps

* Docker e Docker Compose
* GitHub Actions (CI e deploy)
* Render (backend e tarefa agendada) e Vercel (frontend)
* ruff, eslint e pre-commit

---

# 🏗️ Arquitetura

```text
┌────────────────────────────┐   ┌────────────────────────────┐
│          Frontend          │   │           Mobile           │
│   Next.js + React + TS     │   │          Flutter           │
└─────────────┬──────────────┘   └─────────────┬──────────────┘
              │                                │
              └───────── HTTPS + JWT Cookies ──┘
                              │
                ┌─────────────▼──────────────┐
                │      Django REST API       │
                └─────────────┬──────────────┘
                              │
                        PostgreSQL
```

---

# 📂 Estrutura do projeto

```text
equaliza/

├── backend/
│   ├── apps/
│   │   ├── core/           # Modelos base, permissões, paginação e health check
│   │   ├── users/          # Usuários, autenticação e recuperação de senha
│   │   ├── families/       # Famílias e membros
│   │   ├── invitations/    # Convites
│   │   ├── finance/        # Receitas, despesas, categorias e recorrências
│   │   ├── settlements/    # Acerto de contas entre membros: saldo, pagamentos e histórico
│   │   └── reports/        # Dashboard: resumo, gráficos e insights
│   │
│   ├── config/             # Settings (base, development, production, ci) e URLs
│   ├── requirements/
│   └── manage.py
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/            # Rotas (App Router)
│       ├── components/     # Componentes compartilhados (ui, navegação, tabelas, filtros...)
│       ├── features/       # Código por funcionalidade (auth, family, finance, profile...)
│       ├── infra/          # Cliente HTTP
│       ├── lib/
│       ├── constants/
│       └── types/          # Tipos da aplicação e api.d.ts (gerado)
│
├── mobile/                 # Aplicativo Flutter
│
├── openapi/
│   └── schema.yml          # Contrato da API (gerado pelo backend)
│
├── .github/workflows/      # CI, deploy do backend/frontend e release do mobile
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── render.yaml             # Tarefa agendada de recorrências no Render
└── Makefile
```

---

# 🚀 Primeiros passos

## Requisitos

* Node.js 20+
* Python 3.12+
* PostgreSQL (em desenvolvimento, sem `DATABASE_URL`, o backend usa SQLite)
* Docker (opcional)

---

## 1. Clone o projeto

```bash
git clone https://github.com/KevinAeiou/Equaliza.git

cd Equaliza
```

---

## 2. Backend

Instale as dependências:

```bash
cd backend
pip install -r requirements/dev.txt
```

Crie o arquivo `backend/.env`. Em desenvolvimento basta o modo de depuração (sem `DATABASE_URL`, o backend usa SQLite):

```env
DEBUG=True
# DATABASE_URL=postgres://usuario:senha@localhost:5432/equaliza
```

Execute:

```bash
python manage.py migrate

python manage.py runserver
```

Para popular o banco com dados de demonstração:

```bash
python manage.py seed_demo
```

### Variáveis de ambiente

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `SECRET_KEY` | Chave do Django. **Obrigatória em produção** (não pode começar com `django-insecure`) | valor inseguro (só dev) |
| `DEBUG` | Modo de depuração | `False` |
| `DATABASE_URL` | Conexão com o banco | SQLite local |
| `ALLOWED_HOSTS` | Hosts aceitos, separados por vírgula. **Obrigatória em produção** | — |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas pelo CORS, separadas por vírgula | — |
| `CSRF_TRUSTED_ORIGINS` | Origens confiáveis para CSRF, separadas por vírgula | — |
| `FRONTEND_URL` | Endereço do frontend (links dos e-mails) | `http://localhost:3000` |
| `ACCESS_TOKEN_LIFETIME_MINUTES` | Validade do access token | `30` |
| `REFRESH_TOKEN_LIFETIME_DAYS` | Validade do refresh token | `7` |
| `JWT_BLACKLIST_AFTER_ROTATION` | Invalida o refresh anterior a cada renovação | `False` |
| `THROTTLE_RATE_LOGIN` / `_REGISTER` / `_PASSWORD_RESET` / `_INVITATION_VALIDATE` | Limites de requisição por IP nas rotas públicas | `10/min`, `10/hour`, `10/hour`, `30/min` |
| `NUM_PROXIES` | Proxies confiáveis à frente da API (para identificar o IP) | — |
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL` | Envio de e-mails | console |
| `RECURRING_SCHEDULER_ENABLED` | Agendador interno de recorrências (**obsoleto**: use o Cron Job) | `False` |
| `LOG_LEVEL` | Nível dos logs | `INFO` |

---

## 3. Frontend

Instale as dependências:

```bash
cd frontend
npm install
```

Configure o `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Execute:

```bash
npm run dev
```

---

## 4. Docker

```bash
make docker_dev
```

Para popular o banco de desenvolvimento com dados de demonstração:

```bash
make docker_seed
```

---

## 5. Mobile

Consulte o [README do aplicativo mobile](mobile/README.md).

---

# 🔄 Contrato da API (OpenAPI)

O backend publica o schema OpenAPI em `/api/schema/` e a documentação interativa em `/api/docs/` (ambos exigem autenticação).

O schema fica versionado em [`openapi/schema.yml`](openapi/schema.yml) e os tipos TypeScript do frontend são gerados a partir dele em `frontend/src/types/api.d.ts`. Depois de alterar views ou serializers, regenere os dois:

```bash
make gen_api
```

O CI falha se o schema ou os tipos estiverem desatualizados.

---

# 🧪 Testes e qualidade

```bash
# Backend
cd backend
python manage.py test --settings=config.settings.ci
ruff check .

# Frontend
cd frontend
npm run lint
npx tsc --noEmit

# Mobile
cd mobile
flutter analyze
flutter test
```

Para rodar o lint automaticamente antes de cada commit:

```bash
pip install pre-commit
pre-commit install
```

O workflow de CI (`.github/workflows/ci.yml`) executa tudo isso em pull requests e nos pushes para `main` e `dev`.

---

# 🔐 Segurança

O Equaliza utiliza diversas práticas para proteger os dados dos usuários:

* JWT Authentication
* Cookies HttpOnly
* Refresh Token com rotação
* Autenticação obrigatória por padrão em todas as rotas (as públicas são declaradas explicitamente e cobertas por teste)
* Limite de requisições (rate limiting) em login, cadastro, recuperação de senha e validação de convite
* Controle de permissões por perfil
* Validação de dados no frontend com Zod
* Validação de dados no backend com Django REST Framework
* Proteção contra acesso não autorizado
* Em produção, a aplicação não inicia sem `SECRET_KEY` e `ALLOWED_HOSTS`

---

# 📡 API

Todas as rotas ficam sob `/api/`:

```text
/api/login/  /api/logout/  /api/register/  /api/me/  /api/profile/  /api/current/
/api/password-reset/  /api/password-reset/confirm/
/api/families/  /api/families/members/
/api/invitations/  /api/invitations/<token>/validate/  /api/invitations/<token>/accept/
/api/finances/expenses/  /api/finances/income/  /api/finances/recurring/  /api/finances/categories/
/api/reports/dashboard/summary/  /api/reports/dashboard/charts/  /api/reports/dashboard/insights/
/api/settlements/  /api/settlements/balance/  /api/settlements/<id>/cancel/
/api/health/
/api/schema/  /api/docs/
```

Sem autenticação ficam apenas: `login`, `register`, `password-reset`, `password-reset/confirm`, `invitations/<token>/validate` e `health`.

---

# 🚢 Deploy

* **Backend** (Render) e **frontend** (Vercel): o deploy é disparado ao criar uma tag `v*` e só roda se o CI passar.
* **Mobile**: a tag `mobile-v*` gera o APK e o publica em uma release do GitHub.
* **Recorrências**: um Cron Job do Render (`render.yaml`) executa `python manage.py generate_recurring` todos os dias; as vencidas também são lançadas ao listar receitas e despesas. O agendador interno em thread (`RECURRING_SCHEDULER_ENABLED`) está obsoleto e será removido.
* O health check do serviço web pode apontar para `/api/health/`.

---

# 🎯 Objetivos

O Equaliza foi criado para facilitar o gerenciamento financeiro familiar através de uma plataforma colaborativa que permite:

* Centralizar informações financeiras
* Compartilhar despesas entre membros
* Acompanhar indicadores financeiros
* Visualizar dados através de gráficos
* Promover maior transparência entre os participantes da família

---

# 🚧 Roadmap

As fases planejadas estão detalhadas em [PLANO.md](PLANO.md). Em resumo:

* [x] Acerto de contas entre membros
* [ ] Orçamentos por categoria
* [ ] Notificações
* [ ] Metas financeiras
* [ ] Parcelamento de despesas
* [ ] Exportação para Excel e PDF
* [x] Dashboard com insights
* [x] Finanças recorrentes
* [x] Aplicativo mobile
* [x] Modo escuro
* [ ] Internacionalização (i18n)

---

# 🤝 Contribuindo

Contribuições são bem-vindas.

1. Faça um fork do projeto.
2. Crie uma branch para sua feature.
3. Realize suas alterações (rode `make gen_api` se mudar a API).
4. Execute os testes e o lint (veja [Testes e qualidade](#-testes-e-qualidade)).
5. Abra um Pull Request.

---

# 📄 Licença

Este projeto está licenciado sob a licença **MIT**.

---

<p align="center">
  Desenvolvido com ❤️ utilizando Next.js, React, Django REST Framework e Flutter.
</p>
