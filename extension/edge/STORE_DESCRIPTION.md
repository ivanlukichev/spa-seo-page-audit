# Microsoft Edge Add-ons Listing

## Store Name

SPA: SEO Page Audit

## Short Description

Fast local on-page SEO analysis for the current tab with popup summary and full audit view.

## Full Description

SPA: SEO Page Audit provides a practical page-level SEO review directly inside Microsoft Edge.

The extension analyzes the live DOM of the active page and keeps the entire workflow local in the browser, without using third-party SEO APIs or remote scoring services.

Main features:

- Popup mode for quick summary
- Full page mode for detailed audit
- On-Page SEO score with content, technical, and links breakdowns
- Headings, links, images, schema, and social checks
- Accessible anchor name detection for text and image links
- Human-readable issues and quick wins

What it does not do:

- It is not an official Google score
- It does not predict rankings
- It does not provide backlink or traffic metrics

## Privacy Summary

- No external SEO APIs
- No remote page-content processing
- No account or login
- Analysis stays in the browser

## Permissions Rationale

- `activeTab`: temporary access to analyze the active page after explicit user action
- `scripting`: inject the local analysis script only when needed
- `tabs`: target the correct tab and open the full audit page
- `storage`: keep recent local analysis results

## Support Links

- Repository: https://github.com/ivanlukichev/spa-seo-page-audit
- GitHub profile: https://github.com/ivanlukichev
- Website: https://lukichev.biz/
- Privacy policy: https://github.com/ivanlukichev/spa-seo-page-audit/blob/main/PRIVACY.md
