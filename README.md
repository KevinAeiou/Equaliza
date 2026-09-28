# 💰 Equaliza

<p align="center">
  <strong>Gerencie as finanças da sua família de forma simples, colaborativa e inteligente.</strong>
</p>

<p align="center">
  Aplicação Full Stack desenvolvida com <strong>Next.js</strong> e <strong>Django REST Framework</strong>.
</p>

---

## 📖 Sobre o projeto

O **Equaliza** é uma plataforma para gerenciamento financeiro familiar que permite que todos os membros de uma família registrem receitas e despesas em um único ambiente, oferecendo uma visão consolidada da situação financeira através de indicadores e gráficos.

A aplicação foi desenvolvida com foco em:

* 🔒 Segurança
* ⚡ Performance
* 📱 Responsividade
* ♻️ Componentização
* 🎯 Boa experiência do usuário

---

# ✨ Funcionalidades

## 👤 Autenticação

* Cadastro de usuários
* Login seguro
* JWT Authentication
* Cookies HttpOnly
* Renovação automática do Access Token
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
* Aceitação de convite
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
* Contribuição dos membros

Filtros:

* Período
* Categorias

---

## 👤 Perfil

* Alteração do nome
* Escolha de avatar

---

# 🛠️ Tecnologias

## Frontend

* Next.js 16
* React
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

---

## Backend

* Python
* Django
* Django REST Framework
* Django Filter
* Simple JWT
* PostgreSQL

---

## DevOps

* Docker
* Docker Compose

---

# 🏗️ Arquitetura

```text
┌────────────────────────────┐
│        Frontend            │
│   Next.js + React + TS     │
└─────────────┬──────────────┘
              │
      HTTPS + JWT Cookies
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
│   │   ├── authentication/
│   │   ├── dashboard/
│   │   ├── families/
│   │   ├── finances/
│   │   ├── invitations/
│   │   └── users/
│   │
│   ├── config/
│   └── manage.py
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── services/
│       ├── types/
│       └── utils/
│
└── docker-compose.yml
```

---

# 🚀 Primeiros passos

## Requisitos

* Node.js 20+
* Python 3.12+
* PostgreSQL
* Docker (opcional)

---

## 1. Clone o projeto

```bash
git clone https://github.com/seu-usuario/equaliza.git

cd equaliza
```

---

## 2. Backend

Instale as dependências:

```bash
pip install -r requirements.txt
```

Configure o arquivo `.env`:

```env
SECRET_KEY=

DEBUG=True

DATABASE_URL=

ALLOWED_HOSTS=

CORS_ALLOWED_ORIGINS=

ACCESS_TOKEN_LIFETIME=

REFRESH_TOKEN_LIFETIME=
```

Execute:

```bash
python manage.py migrate

python manage.py runserver
```

---

## 3. Frontend

Instale as dependências:

```bash
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
make docker-dev
```

---

# 🔐 Segurança

O Equaliza utiliza diversas práticas para proteger os dados dos usuários:

* JWT Authentication
* Cookies HttpOnly
* Refresh Token
* Controle de permissões por perfil
* Validação de dados no frontend com Zod
* Validação de dados no backend com Django REST Framework
* Proteção contra acesso não autorizado

---

# 📡 API

A API é organizada em módulos independentes:

```text
/auth/
/users/
/families/
/invitations/
/finances/
/dashboard/
```

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

Funcionalidades planejadas para as próximas versões:

* [ ] Notificações
* [ ] Metas financeiras
* [ ] Parcelamento de despesas
* [ ] Exportação para Excel e PDF
* [ ] Dashboard com mais indicadores
* [ ] Aplicativo mobile
* [x] Modo escuro
* [ ] Internacionalização (i18n)

---

# 🤝 Contribuindo

Contribuições são bem-vindas.

1. Faça um fork do projeto.
2. Crie uma branch para sua feature.
3. Realize suas alterações.
4. Execute os testes.
5. Abra um Pull Request.

---

# 📄 Licença

Este projeto está licenciado sob a licença **MIT**.

---

<p align="center">
  Desenvolvido com ❤️ utilizando Next.js, React e Django REST Framework.
</p>
