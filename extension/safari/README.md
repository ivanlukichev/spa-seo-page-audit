# Safari Build

This folder contains the Safari version of `SPA: SEO Page Audit`.

Safari packaging is different from Chrome, Edge, Opera, and Firefox:

- Safari uses a Safari Web Extension wrapped in an Xcode project
- Distribution happens through Apple's App Store flow
- The generated project is intended for macOS Safari

## Project Location

Open this Xcode project:

```text
extension/safari/SPA SEO Page Audit Safari/SPA SEO Page Audit Safari.xcodeproj
```

## What Is Inside

- macOS app target: `SPA SEO Page Audit Safari`
- Safari extension target: `SPA SEO Page Audit Safari Extension`
- embedded web extension resources inside the extension target

## How To Run

1. Open the Xcode project
2. Select the `SPA SEO Page Audit Safari` scheme
3. Build and run the app
4. Enable the extension in Safari:
   Safari > Settings > Extensions

## Notes

- This Safari build was generated from the current browser extension build using Apple's Safari Web Extension converter
- Store listing copy is prepared in `STORE_DESCRIPTION.md`
- The extension logic remains local and does not use external SEO APIs

## Links

- Repository: https://github.com/ivanlukichev/spa-seo-page-audit
- GitHub: https://github.com/ivanlukichev
- Website: https://lukichev.biz/
- Privacy policy: https://github.com/ivanlukichev/spa-seo-page-audit/blob/main/PRIVACY.md
