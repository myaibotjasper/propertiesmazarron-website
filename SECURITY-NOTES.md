# Security notes

## Wrangler / Cloudflare config

- Do not commit secrets (passwords, tokens) in `wrangler.toml`.
- Store secrets using Cloudflare secrets / environment variables in the Cloudflare dashboard or via `wrangler secret put` (for Workers).
- For Pages environment variables, set them in the Pages project settings (not in git).

If you see values like `ADMIN_PASSWORD` in repo history, rotate them.
