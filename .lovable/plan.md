# Plano pré-lançamento

3 entregas independentes pra deixar a plataforma lançável hoje.

## 1. SEO + meta tags + sitemap

**`index.html`** — substituir título/description/og atuais por conteúdo real do RubinTrade:
- `<title>` curto com keyword: "RubinTrade — Marketplace de itens de Tibia"
- `<meta name="description">` < 160 chars descrevendo a plataforma
- `og:title`, `og:description`, `og:url` (https://rubintrade.com), `og:type=website`
- `<link rel="canonical" href="https://rubintrade.com/">`
- JSON-LD Organization (nome, url, logo)
- `<html lang="pt-BR">`

**`public/robots.txt`** — criar:
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /perfil
Disallow: /mensagens
Sitemap: https://rubintrade.com/sitemap.xml
```

**`scripts/generate-sitemap.ts`** + hooks `predev`/`prebuild` no `package.json`:
- Entries estáticos: `/`, `/rifa`, `/suporte`, `/privacidade`, `/login`, `/registro`
- Entries dinâmicos: 1 URL por anúncio ativo (`/anuncio/:id`) e 1 por rifa (`/rifa/:id`), buscando do Supabase com a anon key
- Rotas internas (`/admin`, `/perfil`, `/mensagens`, `/criar-anuncio`) ficam fora

**`react-helmet-async`** para per-route SEO em `Anuncio.tsx` e `Rifa.tsx`:
- Title dinâmico com o nome do anúncio/rifa
- Description com snippet
- Canonical e og:* apontando pra URL específica
- og:image usa a imagem do anúncio quando existir

## 2. Onboarding / primeira visita

Componente `OnboardingTour` montado no `App.tsx` ao lado do `WelcomeOverlay`.

- Modal de 3-4 passos curtos explicando: o que é o site, como criar anúncio, como mandar oferta, como funciona a carteira de coins
- Aparece **só na primeira visita** após login bem-sucedido (`localStorage.onboarding_seen`)
- Botões: "Próximo", "Pular", "Entendi"
- Visual coerente com o `WelcomeOverlay` existente: gradient, ícones lucide, framer-motion suave
- Painel admin opcional **fica de fora** pra não atrasar — textos hardcoded em PT

## 3. Sistema de denúncia / report

**Banco — nova tabela `reports`:**
- `id`, `reporter_id`, `target_type` ('ad' | 'user' | 'message'), `target_id`, `reason` (enum: spam, golpe, conteúdo_impróprio, outro), `details` (text), `status` ('pending' | 'reviewed' | 'dismissed'), `admin_notes`, `reviewed_by`, `created_at`, `updated_at`
- RLS: INSERT autenticado (não-banido); SELECT próprio + admin; UPDATE/DELETE só admin

**Frontend:**
- Componente `ReportDialog` reutilizável (target_type + target_id como props)
- Botão "Denunciar" (ícone `Flag`) em:
  - `Anuncio.tsx` (card do anúncio)
  - `Perfil.tsx` quando visualizando perfil de outro usuário
  - `Mensagens.tsx` no header da conversa (reporta usuário)
- Toast de confirmação após envio

**Admin:**
- Novo painel `ReportsPanel` no `Admin.tsx`
- Tabela com fila pendente, filtros por tipo/status
- Ações: marcar revisado, dispensar, abrir alvo (link pro anúncio/perfil), banir usuário (reusa RPC existente)

## Arquivos novos
- `scripts/generate-sitemap.ts`
- `public/robots.txt`
- `src/components/OnboardingTour.tsx`
- `src/components/ReportDialog.tsx`
- `src/components/admin/ReportsPanel.tsx`
- `src/hooks/useReports.tsx`
- 1 migration nova

## Arquivos editados
- `index.html` (meta tags + JSON-LD)
- `package.json` (predev/prebuild)
- `src/main.tsx` (HelmetProvider)
- `src/App.tsx` (montar OnboardingTour)
- `src/pages/Anuncio.tsx`, `src/pages/Rifa.tsx` (Helmet + botão report)
- `src/pages/Perfil.tsx`, `src/pages/Mensagens.tsx` (botão report)
- `src/pages/Admin.tsx` (aba Reports)

## Fora de escopo (intencionalmente)
- Termos de uso completos — `Privacidade.tsx` já existe; se quiser revisar texto jurídico, faz num passo separado
- Email transacional / notificação de report — pode vir depois
- Analytics (GA, Plausible) — pode vir depois

Posso começar?
