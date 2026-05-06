## Objetivo

Fazer um passe de polimento visual em todo o site mantendo a identidade atual (tema escuro, verde primário `160 84% 44%`, fonte pixel para títulos, layout existente). Foco em **microinterações, efeitos, hierarquia e consistência** — nada de redesenhar telas.

## Escopo

### 1. Sistema de animações global (`tailwind.config.ts` + `src/index.css`)
Adicionar utilitários reutilizáveis que hoje não existem:
- Keyframes: `fade-in`, `fade-in-up`, `scale-in`, `slide-in-right`, `shimmer`, `glow-pulse`, `bounce-soft`
- Animações combinadas: `enter` (fade + scale)
- Classes utilitárias: `.hover-scale`, `.hover-lift`, `.story-link` (underline animado), `.shimmer-text`, `.glass-strong`, `.gradient-border`
- Variáveis novas: `--glow-warning`, `--glow-destructive` para reaproveitar o padrão de glow já existente

### 2. Componentes-base UI (efeitos sutis sem mudar API)
- `button.tsx`: adicionar `active:scale-[0.98]`, `transition-all` em vez de só `transition-colors`, leve `shadow` no `default`/`destructive` e ring focus mais suave
- `card.tsx`: variante implícita via classe — borda com `hover:border-primary/30` e `transition-colors` quando usado como `card-gaming`
- `input.tsx` / `textarea.tsx`: focus ring mais suave (`focus-visible:ring-primary/40`) e `transition-colors`
- `dialog.tsx`: já tem animações Radix; reforçar com `backdrop-blur-sm` no overlay
- `tabs.tsx`: indicador ativo com leve glow primário
- `badge.tsx`: garantir consistência com `badge-active/selling/buying` já definidos no CSS

### 3. Páginas / componentes principais (apenas classes)
Aplicar as novas utilitárias onde já existe estrutura, sem reescrever lógica:
- `Header.tsx`: navegação com `.story-link`, logo com `hover-scale`
- `Index.tsx`: hero com `animate-fade-in-up`, seções com `animate-fade-in` em stagger leve
- `TradeCard.tsx`: já tem `.trade-card`; adicionar `animate-fade-in` no mount e `group-hover` no título
- `Rifa.tsx`: hero/coming-soon com `animate-fade-in`, números/contadores com leve `animate-pulse-glow` no destaque
- `CriarAnuncio.tsx`: stepper com transição entre passos (`animate-fade-in` ao trocar step), chips de mundo com `hover-scale` + `active:scale-95`
- `Admin.tsx`: tabs com transição `animate-fade-in` ao trocar
- `LiveStreamersWidget.tsx` / `SponsorsCarousel.tsx`: `hover-lift` nos cards, dot "ao vivo" com pulse vermelho
- `OffersPanel.tsx` / `Mensagens.tsx`: itens de lista com `transition-colors` e `hover:bg-secondary/60`

### 4. Consistência e detalhes
- Padronizar `rounded` (usar `rounded-lg`/`rounded-xl` já no padrão)
- Skeletons: usar `.shimmer` nas áreas de loading que hoje só mostram texto "Carregando..."
- Toaster (`sonner`): garantir tema escuro consistente com cores `success`/`destructive`/`warning`
- Scrollbar: aumentar leve contraste no `::-webkit-scrollbar-thumb` em hover

## O que NÃO muda
- Paleta de cores, tipografia, layout das páginas, estrutura de componentes, lógica/estado, schema do banco, hooks. Nenhum redesenho — só polimento.

## Detalhes técnicos

Arquivos editados (estimativa):
- `tailwind.config.ts` — novos keyframes/animations
- `src/index.css` — novas utilitárias (`.hover-scale`, `.hover-lift`, `.story-link`, `.shimmer`, `.glass-strong`)
- `src/components/ui/{button,card,input,textarea,dialog,tabs}.tsx` — ajustes mínimos de classes
- `src/components/Header.tsx`, `TradeCard.tsx`, `LiveStreamersWidget.tsx`, `SponsorsCarousel.tsx`, `OffersPanel.tsx`
- `src/pages/{Index,Rifa,CriarAnuncio,Admin,Mensagens}.tsx` — adicionar classes de animação/hover

Sem migrações, sem novas dependências, sem mudança de comportamento.
