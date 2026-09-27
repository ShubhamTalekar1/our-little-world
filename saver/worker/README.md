# Your own link-preview proxy (optional, 5 minutes)

Browsers can't read other websites' HTML directly, so Saver fetches pages
through a proxy to get titles, photos, recipes and addresses. It falls back
to free public proxies, but they're slow and often blocked. This Worker is
your own, and it's free on Cloudflare.

1. Sign up at <https://dash.cloudflare.com> (free).
2. **Workers & Pages → Create → Create Worker**, name it e.g. `saver-proxy`, **Deploy**.
3. **Edit code**, replace everything with the contents of [`proxy.js`](./proxy.js), **Deploy**.
4. Optional but recommended: **Settings → Variables** → add `ALLOWED_ORIGIN`
   set to where you host Saver (e.g. `https://yourname.github.io`), so only
   your app can use it.
5. In Saver → **Settings → Link previews**, paste
   `https://saver-proxy.<your-subdomain>.workers.dev/?url={url}` and tap **Test**.

With the Wrangler CLI instead: `npx wrangler deploy worker/proxy.js --name saver-proxy --compatibility-date 2024-09-01`.
