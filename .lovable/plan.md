# Plano de implementação

São 5 entregas independentes. Posso fazer tudo numa só leva.

## 1. Card de destaque (Top 3) mais chamativo
Quando não há anúncios em destaque, o card atual fica pequeno e sem peso visual.

- Reescrever o estado vazio do card "Em destaque" no `Index.tsx`:
  - Ocupar **toda a altura** dos cards do top 3 ao lado (`h-full`, `min-h-[260px]`).
  - Fundo com gradiente animado (laranja/amarelo/primary) + glow + ícone `Flame` grande pulsando.
  - Headline forte ("Seu anúncio em destaque aqui"), bullets curtos com benefícios e CTA grande "Destacar meu anúncio" → leva pra `/perfil` (gerenciar anúncios) ou `/criar-anuncio`.
  - Animação suave (framer-motion já é hábito? usar puro CSS via `animate-pulse` + gradient shift do tailwind config).

## 2. Desativar VIP por enquanto
- Esconder painel `VipAdminPanel` da tela de admin.
- Esconder botões "Comprar VIP" / "VIP" da UI pública (Header, Perfil, etc).
- **Não** remover tabelas / RPCs — apenas flag de UI (`const VIP_ENABLED = false`) num arquivo `src/lib/feature-flags.ts` para reativar fácil.

## 3. Selos (badges) customizáveis no admin
Hoje os selos são tipos enum fixos. Vou estender pro tipo `custom` com label, cor e ícone livres.

**Banco:**
- Adicionar coluna `custom_icon_url text` em `user_badges`.
- Criar bucket de storage `badge-icons` (público) com policies: leitura pública, upload/delete só admin.

**Admin:**
- Novo componente `CustomBadgeDialog` em `UserBadgeControls.tsx`:
  - Inputs: label, cor (color picker), upload de ícone (PNG/SVG ≤ 200KB).
  - Salva como `badge_type='custom'` com `custom_label`, `custom_color`, `custom_icon_url`.
- Atualizar `UserBadges.tsx` para renderizar o ícone customizado quando `badge_type='custom'` e existir url.

## 4. Links de afiliado interno com tracking
Sistema simples de short-links com contador de clicks, gerenciado só no admin.

**Banco — nova tabela `affiliate_links`:**
- `slug` (unique), `target_url`, `label`, `description`, `active`, `click_count`, `created_by`, `created_at`.
- Tabela `affiliate_link_clicks`: `link_id`, `created_at`, `referrer`, `user_agent_hash` (não guardar IP cru).
- RLS: SELECT público apenas em `affiliate_links` (precisa pra resolver slug); INSERT/UPDATE/DELETE só admin. `affiliate_link_clicks` só admin.
- RPC `register_affiliate_click(p_slug text)` SECURITY DEFINER que incrementa contador e insere registro.

**Frontend:**
- Nova rota `/go/:slug` → componente que chama a RPC, mostra tela de redirect curtinha e `window.location.href = target_url`.
- Novo painel `AffiliateLinksPanel` no admin: CRUD + tabela com clicks totais + botão "copiar link" (`https://site/go/slug`).

## 5. Splash / página de boas-vindas
Tela fullscreen exibida antes do site, só na primeira visita da sessão (configurável).

**Banco — extender `site_assets` ou criar `welcome_screen_settings`:**
- Tabela `welcome_screen_settings` (single-row): `enabled`, `title`, `subtitle`, `cta_text`, `cta_url`, `background_image_url`, `accent_color`, `show_once_per_session` (bool).

**Frontend:**
- Componente `WelcomeOverlay` montado no `App.tsx` (acima das rotas).
  - Busca settings; se `enabled` e `!sessionStorage.welcome_seen`, renderiza overlay fullscreen.
  - Visual: hero com background, ícone animado, gradiente vibrante, título grande (display font), CTA grande "Entrar", botão "fechar".
  - Animação de entrada (scale + fade) e saída.
- Painel admin `WelcomePanel`: toggle ativo, editar textos, upload de imagem de fundo, escolher cor de destaque, preview.

## Arquivos novos
- `src/lib/feature-flags.ts`
- `src/components/admin/CustomBadgeDialog.tsx`
- `src/components/admin/AffiliateLinksPanel.tsx`
- `src/components/admin/WelcomePanel.tsx`
- `src/components/WelcomeOverlay.tsx`
- `src/pages/AffiliateRedirect.tsx`
- `src/hooks/useAffiliateLinks.tsx`
- `src/hooks/useWelcomeSettings.tsx`

## Arquivos editados
- `src/pages/Index.tsx` (CTA card)
- `src/pages/Admin.tsx` (esconder VIP, adicionar painéis novos)
- `src/components/admin/UserBadgeControls.tsx` (botão "novo selo custom")
- `src/components/UserBadges.tsx` (renderizar ícone custom)
- `src/components/Header.tsx` (esconder UI VIP)
- `src/App.tsx` (rota /go/:slug + WelcomeOverlay)
- 1 migration nova

## Detalhes técnicos
- Storage: bucket `badge-icons` público, `welcome-bg` público.
- Tracking de clicks: hash SHA-256 do `user-agent + dia` para deduplicar grosseiramente sem armazenar PII.
- Splash usa `sessionStorage` (some ao fechar a aba); admin pode forçar "sempre mostrar" via flag.
- Feature flag VIP é só de UI; código de back-end fica intacto pra reativar depois.

Posso começar?