# SPA: SEO Page Audit

![SPA: SEO Page Audit banner](./assets/readme-banner.png)

Local browser extension for fast on-page SEO analysis of the current page.

It works entirely in the browser, reads the live DOM, and does not use Ahrefs, Semrush, Moz, Search Console, or other third-party SEO APIs.

## Project Links

- Repository: [github.com/ivanlukichev/spa-seo-page-audit](https://github.com/ivanlukichev/spa-seo-page-audit)
- GitHub profile: [github.com/ivanlukichev](https://github.com/ivanlukichev)
- Website: [lukichev.biz](https://lukichev.biz/)
- Privacy policy: [PRIVACY.md](./PRIVACY.md)

## What The Extension Does

- Calculates an on-page SEO score for the current page
- Separates analysis into `Content`, `Technical`, and `Links` sections
- Supports two UI modes:
  - `Popup mode` for quick summary
  - `Full page mode` for detailed audit
- Extracts headings, links, images, schema, social tags, and text stats
- Generates short human-readable issues and quick wins
- Keeps analysis local inside the browser

## What It Does Not Do

- It is not an official Google score
- It does not predict rankings
- It does not fetch backlink, traffic, DR/DA, or SERP metrics
- It does not send page content to external analysis servers

## Architecture

- `content script`: extracts page signals from the live DOM
- `background`: centralized store keyed by `tabId`
- `popup`: compact summary view
- `full page`: full audit interface in a separate extension tab
- `shared scoring`: one scoring engine reused across the extension

## Repository Layout

```text
extension/            Browser-ready builds by store/browser
src/                  Source TypeScript app scaffold
public/               Source public assets
README.md
PRIVACY.md
LICENSE
```

## Browser Builds

Ready-to-load extension folders:

```text
extension/chrome
extension/edge
extension/opera
extension/firefox
```

Each of these folders is self-contained and does not require `npm`, `vite`, or a build step in its current form.

## Load As Unpacked Extension

### Chrome / Edge

1. Open `chrome://extensions` or `edge://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `extension/chrome` for Chrome or `extension/edge` for Edge

### Opera

1. Open `opera://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `extension/opera`

### Firefox

Manifest V3 support is still evolving, so Firefox support is best-effort.

1. Open `about:debugging#/runtime/this-firefox`
2. Click `Load Temporary Add-on`
3. Select `extension/firefox/manifest.json`

## Local Development Source

The repo also contains the original source scaffold for a TypeScript + Vite version.

Prerequisites:

- Node.js 20+
- npm 10+

Install dependencies:

```bash
npm install
```

Run development build watcher:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

## Signals Covered

- URL
- Title
- Meta description
- Canonical
- Robots meta
- `html[lang]`
- Viewport
- Charset
- Favicon
- H1-H6 structure
- Internal and external links
- Accessible anchor names
- Images and alt coverage
- JSON-LD / schema
- Open Graph / Twitter tags
- Visible word count and keyword snapshots

## Limitations

- SPA pages may require manual re-analysis after route changes
- Cross-origin iframes cannot be inspected
- Shadow DOM is not deeply traversed in the current MVP
- Browser-restricted pages cannot be analyzed
- Keyword density is informational only

## License

Released under the [MIT License](./LICENSE).
