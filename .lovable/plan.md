## Objetivos

1. **Redesenho visual de Criar Anúncio** com cards modernos, bandeiras por região do mundo, e seleção mais rica.
2. **Painel admin de Mundos** (novo) — gerenciar nome, PvP, **região e URL/emoji da bandeira**, ativo/sort.
3. **Rifas** — opção de **bloquear compra de bilhetes** (modo "somente visualização" / vendas pausadas) por rifa, configurável no admin e respeitada na página pública.

---

## 1. Banco de dados (migration)

**Tabela `worlds`** — adicionar:
- `flag_url text` (URL de imagem da bandeira, opcional)
- `flag_emoji text` (fallback rápido tipo 🇧🇷, opcional)

**Tabela `raffles`** — adicionar:
- `sales_blocked boolean default false` — quando true, usuários veem a rifa mas não conseguem comprar bilhetes (botão desabilitado + aviso). Status continua "active" para aparecer na listagem.

Trigger de audit log em raffles já cobre updates dessa coluna.

---

## 2. Painel admin de Mundos (novo)

**Arquivo novo:** `src/components/admin/WorldsAdminPanel.tsx`
- Listar todos os mundos (`useWorlds(false)`).
- Form: nome, PvP type (select), região (select com valores comuns: BR, EU, NA, SA, ASIA + custom), `flag_url`, `flag_emoji`, `active`, `sort_order`.
- Preview da bandeira ao lado.
- CRUD usando `useWorldMutations` (já existe).

**`src/pages/Admin.tsx`:** adicionar nova aba "Mundos" apontando para esse painel.

---

## 3. Bandeiras por região — utilitário compartilhado

**Arquivo novo:** `src/lib/world-flags.ts`
- Mapa default `region -> emoji` (BR🇧🇷, EU🇪🇺, NA🇺🇸, SA🌎, ASIA🌏).
- Função `getWorldFlag(world)` que retorna `{ url?, emoji }` priorizando `flag_url > flag_emoji > mapa default por região`.
- Componente `<WorldFlag world={...} size="sm|md" />` que renderiza img ou emoji.

---

## 4. Redesenho de `CriarAnuncio.tsx`

Manter funcionalidade existente, melhorar visual:

- **Stepper visual** (1. Item → 2. Tipo & Preço → 3. Mundo → 4. Publicar) no topo com ícones e progresso.
- **Card "Selecione o item"**: tabs Tibia/Custom maiores, com contador estilizado, preview do item selecionado em card destacado com nome + tier badge + categoria.
- **Card "Tipo & Preço"**: dois botões grandes (Vendendo/Comprando) com ícones e gradient quando ativo. Campo de preço com ícone da moeda dentro.
- **Card "Mundo"**: substituir Select simples por **grid de chips clicáveis**, agrupados por região com **bandeira** ao lado de cada mundo. Cada chip mostra: bandeira, nome, badge PvP. Selecionado ganha destaque com `ring` warning/primary. Filtro/busca por nome no topo.
  - Mostrar PvP detectado abaixo após selecionar.
- **Card "Descrição"**: textarea estilizada com contador de caracteres.
- **Botão final** maior, com gradient e shadow, ícone Sparkles.
- Animações suaves (`transition-all`), mantendo paleta atual (warning/primary/secondary).

---

## 5. Bloqueio de compra de bilhetes nas rifas

**Admin (`RafflesAdminPanel.tsx`):**
- Adicionar `sales_blocked` no form (Switch "Bloquear compra de bilhetes").
- Botão de toggle rápido em cada card da rifa: "🔒 Bloquear vendas" / "🔓 Liberar vendas".
- Badge visual na lista quando bloqueado.

**Hooks (`useRaffles.tsx` / `useRafflesAdmin.tsx`):**
- Incluir `sales_blocked` nos selects e nas mutations create/update.

**Pública (`Rifa.tsx`):**
- No card da listagem (`RaffleCard`): se `sales_blocked`, trocar CTA "Garantir meus bilhetes" por badge "🔒 Vendas pausadas" e desabilitar hover de compra.
- Na página de detalhe da rifa: desabilitar input de quantidade + botão "Comprar", mostrar aviso destacado "As vendas desta rifa estão temporariamente pausadas pelo administrador."
- `useBuyRaffleNumbers` faz validação extra: se `sales_blocked`, retorna erro antes de chamar a RPC (defesa em profundidade — backend continua aceitando, mas UI bloqueia).

---

## Arquivos afetados

- **Migration nova**: `worlds.flag_url`, `worlds.flag_emoji`, `raffles.sales_blocked`.
- **Novos**: `src/components/admin/WorldsAdminPanel.tsx`, `src/lib/world-flags.ts`, `src/components/WorldFlag.tsx`.
- **Editados**: `src/pages/Admin.tsx`, `src/pages/CriarAnuncio.tsx`, `src/pages/Rifa.tsx`, `src/components/admin/RafflesAdminPanel.tsx`, `src/hooks/useRaffles.tsx`, `src/hooks/useRafflesAdmin.tsx`.

Pronto para aprovar?