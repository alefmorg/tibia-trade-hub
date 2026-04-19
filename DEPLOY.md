# Deploy

O build é estático (Vite) e funciona em qualquer hospedagem com fallback SPA.

```bash
npm run build   # gera ./dist
```

## Variáveis de ambiente obrigatórias

Configure no painel da plataforma (ou em `.env` local):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Se faltarem, o app exibe um erro amigável em vez de abrir em branco.

## Vercel
Já configurado em `vercel.json` (rewrite `/(.*)` → `/`). Basta importar o repo.

## Netlify
Use `public/_redirects` (já criado). Build command: `npm run build`. Publish dir: `dist`.

## Cloudflare Pages
Mesma config do Netlify — usa `public/_redirects` automaticamente. Build: `npm run build`. Output: `dist`.

## Firebase Hosting
`firebase.json` já configurado.
```bash
npm run build && firebase deploy --only hosting
```

## Nginx / VPS
Copie `dist/` para o servidor e use `deploy/nginx.conf` como base.

## Hospedagem estática genérica (S3, GitHub Pages, etc.)
Faça upload de `dist/` e configure o servidor para servir `index.html` em qualquer rota não-encontrada (fallback SPA).
