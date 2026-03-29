# Firefox Add-ons Listing

## Store Name

SPA: SEO Page Audit

## Short Description

Fast local on-page SEO analysis for the current tab with popup summary and full audit view.

## Full Description

SPA: SEO Page Audit gives you a local page-level SEO audit workflow inside Firefox.

The extension analyzes the current page in the browser, uses browser-detectable signals from the live DOM, and avoids third-party SEO APIs or remote scoring services.

Main features:

- Popup mode for quick summary
- Full page mode for detailed audit
- On-Page SEO score with section breakdowns
- Headings, links, images, schema, and social checks
- Accessible anchor name detection across text links, aria labels, and image alt text
- Human-readable issues and quick wins

What it does not do:

- It is not an official Google score
- It does not estimate rankings
- It does not use backlink or traffic data providers

## Privacy Summary

- No third-party SEO APIs
- No remote page-content analysis
- No account required
- Analysis runs locally inside Firefox

## Permissions Rationale

- `activeTab`: temporary access to analyze the active page after explicit user action
- `scripting`: inject the local analysis script only when needed
- `tabs`: map analysis to the correct tab and open the full audit page
- `storage`: keep short-lived local analysis state

## Support Links

- Repository: https://github.com/ivanlukichev/spa-seo-page-audit
- GitHub profile: https://github.com/ivanlukichev
- Website: https://lukichev.biz/
- Privacy policy: https://github.com/ivanlukichev/spa-seo-page-audit/blob/main/PRIVACY.md
