## Mudanças na home (`src/pages/Index.tsx`)

**1. Paginação numerada (substitui scroll infinito)**
- Trocar `useInfiniteAds` por `useAds` com paginação tradicional (page + pageSize).
- Tamanho de página: **24 anúncios** por página.
- Adicionar componente `Pagination` (já existe em `src/components/ui/pagination.tsx`) no fim da lista, com botões anterior/próxima e numeração (ex: `1 2 3 … 8`).
- Remover sentinel/IntersectionObserver e o spinner de "carregando próxima".
- Ao trocar filtros/busca, reseta para a página 1 e faz scroll suave pro topo da lista.
- Atualizar `useAds` (ou criar `usePagedAds`) em `src/hooks/useAds.tsx` para aceitar `page` e retornar `{ items, total, totalPages }` usando `range()` + `count: 'exact'`.

**2. Ordenação no filtro**
- Remover **"Menor preço"** e **"Maior preço"** do `<Select>` de ordenação.
- Manter **"Mais curtidos"** (já é o default — nada a acrescentar, já existe).
- Resultado final do select: `Mais curtidos` · `Mais recentes`.

**3. Card "Itens em Destaque" sem destaques → CTA**
- Quando `featuredAds.length === 0`, em vez de mostrar regulares ou texto vazio, exibir um **CTA visual** dentro do mesmo card incentivando o usuário a destacar:
  - Ícone Flame grande, headline "Seu anúncio aqui em destaque", subtítulo curto explicando o benefício (mais visibilidade, topo da home), e botão "Destacar meu anúncio" → leva para `/perfil` (ou `/criar-anuncio` se não logado).
- Manter a estética warning/dourado já usada no card.

**4. Copy do badge "Top 3"**
- O texto pequeno embaixo de "Itens em Destaque" diz "Selecionados pela comunidade", o que é incorreto (são anúncios pagos/promovidos).
- Trocar para algo mais honesto: **"Anúncios em destaque"** ou **"Promovidos pelos anunciantes"**. Usar a segunda opção.

## Header mobile (`src/components/Header.tsx`)

- Revisar layout em viewports < 640px: garantir que logo, ações (criar anúncio, sino, avatar) caibam sem quebrar, esconder texto de itens não essenciais, usar ícones apenas, e/ou mover ações secundárias para o menu hambúrguer.
- Ajustar paddings/gaps para densidade mobile.
- (Vou ler o Header atual antes de implementar para preservar a estrutura existente.)

## Página Reset de Senha (`src/pages/ResetPassword.tsx`)

A página já tem o mesmo "frame pixel" da `EsqueciSenha`, mas o usuário acha que está fora do padrão do **resto do site** (que usa cards arredondados `rounded-2xl`, sem moldura pixel). Proposta: **alinhar `ResetPassword` E `EsqueciSenha` ao visual do Login/Registro** (mesmas bordas, mesmos botões, mesma tipografia), garantindo consistência total.

Antes de codar, preciso confirmar a direção (ver pergunta abaixo).

## Exigir confirmação de e-mail

- Desativar `auto_confirm_email` em auth (via `configure_auth`) — usuário precisa clicar no link enviado por e-mail antes de logar.
- No fluxo de signup (`Registro.tsx`): após cadastro bem-sucedido, mostrar mensagem "Confirme seu e-mail para acessar" e **não** fazer login automático.
- No login (`Login.tsx`): tratar erro `email_not_confirmed` exibindo aviso amigável + botão "Reenviar e-mail de confirmação" (`supabase.auth.resend({ type: 'signup', email })`).
- Templates de signup já existem em `_shared/email-templates/signup.tsx` (criados anteriormente) — nada a fazer ali.

## Detalhes técnicos

- `useAds`: adicionar `page`/`pageSize` com `.range(from, to)` e `{ count: 'exact' }` para devolver total.
- Filtros que afetam a query devem invalidar a página atual (resetar para 1 via `useEffect`).
- Featured ads continuam buscados separadamente (ou a query principal mantém ordenação por `featured desc`) — manter comportamento atual onde featured aparecem destacados acima dos regulares na mesma página.
- Confirmação de e-mail é alteração de configuração do backend de auth (não migração SQL).
