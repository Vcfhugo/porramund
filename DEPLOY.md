# Despliegue — Porra Mundial 2026 (Cloudflare Pages)

Web **100% estática** (sin paso de build): se sirven los archivos tal cual.
Migrada de Netlify a **Cloudflare Pages** (gratis, sin límites prácticos, sirve desde la raíz).

## Archivos de configuración
- `_redirects` — alias `/web`, callback `/auth/callback` y SPA catch-all (equivale al `netlify.toml`).
- `_headers` — cabeceras de seguridad (CSP, HSTS…) y `Cache-Control`.
- `supabase-client.js` — credenciales del frontend. **Se commitea**: la `anon key` es pública por diseño (la seguridad la dan las políticas RLS de la base de datos).

## Desplegar en Cloudflare Pages (vía GitHub)
1. Sube los cambios al repo de GitHub (`git push`).
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Elige el repositorio `Vcfhugo/porramund`.
4. Configuración de build:
   - **Framework preset:** `None`
   - **Build command:** *(vacío)*
   - **Build output directory:** `/`  (la raíz del repo)
5. **Save and Deploy**. En ~1 min tendrás una URL `https://<proyecto>.pages.dev`.

## Dominio propio (opcional)
Pages → tu proyecto → **Custom domains** → añade `porra.hugo.carreres.com`
(apunta el DNS a Cloudflare según te indique el panel).

## Tras el primer deploy — configurar Auth en Supabase
Para que el login (enlace mágico y Google) redirija bien, en
**Supabase → Authentication → URL Configuration**:
- **Site URL:** la URL de producción (p. ej. `https://porra.hugo.carreres.com` o la `*.pages.dev`).
- **Redirect URLs:** añade además `http://localhost:3456/**` para desarrollo local.

Para **Google**: Authentication → Providers → Google → activar y poner el Client ID/Secret
de Google Cloud (el enlace mágico por email funciona sin configurar nada extra).

## Desarrollo local
```
npx serve -p 3456 .      # o:  python3 -m http.server 3456
```
Abre http://localhost:3456
