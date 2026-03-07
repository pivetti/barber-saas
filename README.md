# 💈 Sistema de agendamento
Esse é um sistema de agendamento para barbearia com área do cliente e painel administrativo completo.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-UI-38B2AC?logo=tailwindcss)

## 📌 Visão Geral

Ele resolve problemas comuns como:
- organização de horários por barbeiro
- confirmação e gerenciamento de agendamentos
- controle de cancelamentos por token
- gestão administrativa (serviços, agenda, horários e barbeiros)

Público-alvo:
- clientes que querem agendar online com rapidez
- barbearias que precisam centralizar operação e agenda

## ⚙️ Funcionalidades
- Fluxo de agendamento para cliente (`/agendar` → `/barbers` → serviços/horário)
- Confirmação de agendamento com token de cancelamento
- Página de gerenciamento de agendamento por token (`/bookings`)
- Solicitação de cancelamento sem token
- Painel administrativo com autenticação por e-mail/senha
- Agenda diária do barbeiro no painel (`/admin/dashboard`)
- Gestão de horários e bloqueios (`/admin/schedule`)
- Gestão de serviços (`/admin/services`)
- Gestão de barbeiros com papéis e permissões (`/admin/barbers`)
- Controle de papéis: `OWNER`, `ADMIN`, `BARBER`
- Inativação de barbeiros sem exclusão física (`isActive`)

## 🧰 Stack Tecnológica
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **UI:** Tailwind CSS, Radix UI, Lucide Icons, Sonner
- **Backend (BFF):** Server Actions + Route Handlers (Next.js)
- **Banco de dados:** PostgreSQL
- **ORM:** Prisma
- **Autenticação:** JWT + cookies HTTP-only
- **Validação:** Zod
- **Segurança de senha:** bcrypt
- **Datas:** date-fns

## 🏗️ Arquitetura
Estrutura principal do projeto:

- `src/app`: rotas, páginas e layout da aplicação (App Router)
- `src/app/_components`: componentes compartilhados de UI/fluxo
- `src/app/_actions`: server actions do fluxo público
- `src/app/admin`: painel administrativo
- `src/app/admin/_actions`: regras de negócio do admin
- `src/app/_lib`: autenticação, permissões, Prisma, utilitários e env
- `src/app/api`: endpoints HTTP (login/logout/me)
- `prisma/schema.prisma`: modelagem do banco
- `prisma/migrations`: histórico de migrações
- `prisma/seed.ts`: seed inicial do sistema

## 🚀 Instalação
```bash
git clone <repository-url>
cd barber-saas
npm install
```

### 1. Configure o ambiente
```bash
cp .env.example .env
```

### 2. Ajuste as variáveis do `.env`
Defina `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

### 3. Rode as migrações e seed
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Inicie a aplicação
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 🔐 Variáveis de Ambiente
Variáveis obrigatórias:
- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`

Variáveis opcionais para seed:
- `ADMIN_ROLE` (`OWNER` ou `ADMIN`)
- `ADMIN_NAME`
- `ADMIN_PHONE`
- `ADMIN_IMAGE_URL`
- `SEED_DEMO_PASSWORD`

Exemplo:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/barbershop"
ADMIN_EMAIL="admin@barbearia.com"
ADMIN_PASSWORD="troque-essa-senha"
ADMIN_ROLE="OWNER"
JWT_SECRET="troque-por-um-segredo-forte"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🧭 Como Usar
### Fluxo do cliente
1. Acesse a home (`/`)
2. Clique em **Agendar**
3. Selecione barbeiro, serviço, data e horário
4. Confirme e salve o token de cancelamento
5. Para gerenciar/cancelar, use `/bookings`

### Fluxo administrativo
1. Acesse `/admin/login`
2. Faça login com e-mail e senha de barbeiro ativo
3. Gerencie:
- agenda em `/admin/dashboard`
- horários em `/admin/schedule`
- serviços em `/admin/services` (OWNER/ADMIN)
- barbeiros em `/admin/barbers` (OWNER/ADMIN)

## 🖼️ Screenshots
Você pode inserir capturas aqui:

- `docs/screenshots/home.png` (Home)
- `docs/screenshots/agendamento.png` (Fluxo de agendamento)
- `docs/screenshots/admin-dashboard.png` (Painel administrativo)
- `docs/screenshots/admin-barbers.png` (Gestão de barbeiros)

## 🗺️ Roadmap
- [ ] Notificações automáticas (WhatsApp/e-mail)
- [ ] Histórico avançado e relatórios de performance
- [ ] Multi-unidade (mais de uma barbearia)
- [ ] Testes automatizados (unitários/integrados)
- [ ] Internacionalização (i18n)

## 🤝 Contribuindo
1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit: `git commit -m "feat: minha feature"`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

Antes de abrir PR:
```bash
npm run lint
```

## 📄 Licença
Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE).
