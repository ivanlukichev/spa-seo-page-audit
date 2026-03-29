# Opera Add-ons Listing

## Store Name

SPA: SEO Page Audit

## Short Description

Fast local on-page SEO analysis for the current tab with popup summary and full audit view.

## Full Description

SPA: SEO Page Audit is a lightweight on-page SEO inspector for Opera.

It checks the current page locally in the browser and focuses on practical, browser-detectable SEO signals instead of backlink databases or external ranking services.

Main features:

- Popup mode for fast overview
- Full page mode for detailed audit
- On-Page SEO score and section scores
- Headings, links, images, schema, and social analysis
- Better empty-anchor detection for image links and accessible labels
- Clear recommendations and quick wins

What it does not do:

- It is not an official Google score
- It does not crawl websites in bulk
- It does not use external SEO APIs

## Privacy Summary

- No external API calls for analysis
- No user account
- No remote storage of page content
- Analysis runs locally in the browser

## Permissions Rationale

- `activeTab`: temporary access to analyze the current page after explicit user action
- `scripting`: inject the local analysis script only when needed
- `tabs`: open the full audit tab and track the analyzed tab
- `storage`: keep the latest local analysis state

## Support Links

- Repository: https://github.com/ivanlukichev/spa-seo-page-audit
- GitHub profile: https://github.com/ivanlukichev
- Website: https://lukichev.biz/
- Privacy policy: https://github.com/ivanlukichev/spa-seo-page-audit/blob/main/PRIVACY.md
