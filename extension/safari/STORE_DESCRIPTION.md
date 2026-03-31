# App Store Listing

## App Name

SPA: SEO Page Audit Safari

## Short Description

Fast local on-page SEO analysis for the current page in Safari.

## Full Description

SPA: SEO Page Audit Safari helps you review the on-page SEO signals of the page you are currently viewing in Safari.

The extension works locally in the browser and analyzes the live DOM of the active page without using third-party SEO APIs or remote scoring services.

Main features:

- Popup mode for quick summary
- Full page mode for detailed audit
- On-Page SEO score with section breakdowns
- Headings analysis
- Links analysis with accessible anchor name detection
- Images and alt coverage review
- Schema and social meta checks
- Human-readable issues and quick wins

What it does not do:

- It is not an official Google score
- It does not estimate rankings
- It does not fetch backlinks, DR, DA, or traffic metrics

## Privacy Summary

- No external SEO APIs
- No remote content analysis service
- No account required
- Analysis happens locally in the browser

## Permissions Rationale

- `activeTab`: temporary access to analyze the current tab after explicit user action
- `scripting`: inject the local analysis script only when needed
- `tabs`: identify the active tab and open the full audit view
- `storage`: keep the latest local analysis state per tab

## Support Links

- Repository: https://github.com/ivanlukichev/spa-seo-page-audit
- GitHub profile: https://github.com/ivanlukichev
- Website: https://lukichev.biz/
- Privacy policy: https://github.com/ivanlukichev/spa-seo-page-audit/blob/main/PRIVACY.md
