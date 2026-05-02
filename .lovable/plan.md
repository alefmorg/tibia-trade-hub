## Issues to fix

### 1) Admin → Anúncios mostra anúncios expirados
The public listing (`useAds` / `useInfiniteAds`) já filtra `expires_at`/`featured_until`, mas o admin (`useAllAdsAdmin` em `src/hooks/useAds.tsx`) retorna **todos** os anúncios. O usuário quer que anúncios destacados expirados (cujo `featured_until` já passou) e anúncios comuns expirados sumam do painel admin de anúncios também.

**Fix:** Em `useAllAdsAdmin`, aplicar o mesmo filtro usado em `useAds`:
- Mantém o anúncio se `expires_at` ainda é futuro **OU** (`featured` + `featured_until` ainda futuro).
- Anúncios com `status` diferente de `active` (ex.: `paused`, `sold`) continuam aparecendo normalmente — o filtro de tempo só se aplica a `active`, para o admin ainda poder gerenciar pausados/vendidos.

Resultado: na aba Anúncios do Admin, itens destacados que já passaram do `featured_until` (e do `expires_at`) deixam de aparecer, igual à listagem pública.

### 2) Logo do "foginho" no Login e Registro
Atualmente `src/pages/Login.tsx` e `src/pages/Registro.tsx` usam o ícone `Sword` da lucide-react. O Header já usa `Flame` (o "foginho" do RubinTrade).

**Fix:** 
- Substituir o import `Sword` por `Flame` em ambos arquivos.
- Trocar `<Sword className="h-5 w-5 text-primary" strokeWidth={2.25} />` por `<Flame className="h-5 w-5 text-primary" strokeWidth={2.25} />`.

## Arquivos alterados
- `src/hooks/useAds.tsx` — filtro de expiração em `useAllAdsAdmin`.
- `src/pages/Login.tsx` — `Sword` → `Flame`.
- `src/pages/Registro.tsx` — `Sword` → `Flame`.

Sem mudanças de banco de dados.
