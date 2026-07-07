This repo keeps releases of VpnHood! CONNECT

For source code, see: https://github.com/vpnhood/VpnHood

## Publishing (runs on GitHub Actions — never locally)

All builds and all Fastlane publishing for Connect run on **GitHub Actions**. Do **not** build the
`.ipa`/AAB/MSI or run Fastlane from a developer machine — the runners hold the signing keys, the
Xcode/.NET toolchain, and the store credentials.

- **App builds + store uploads** — `connect_publish.yml`. Builds Linux/Windows/Android/iOS from the
  monorepo (`vpnhood/VpnHood`), uploads the AAB to Google Play and the `.ipa` to **TestFlight**, and
  creates the GitHub release here. Dispatched by `Pub/Connect/PublishByGithub.ps1` in the monorepo
  (which bumps the version first). Connect iOS is **TestFlight-only** pending App Store review policy.
- **App Store listing** (metadata text + screenshots, no binary) — `publish_appstore_metadata.yml`.
  Runs Fastlane `deliver` (the `ios upload_metadata` lane) against `com.vpnhood.connect.ios`. Assets
  live in `fastlane/metadata/ios/**` + `fastlane/screenshots/ios/**`. For a brand-new app's FIRST
  version, dispatch it twice (once `skip_metadata=true`, once `skip_screenshots=true`) — see the
  workflow header for why.
- **Google Play listing** (metadata/images) — the `android publish_contents` Fastlane lane.

Secrets/variables live on this repo; the Apple signing cert + App Store Connect API key are inherited
org secrets. See `connect_publish.yml`'s header and the monorepo `.github/DEPLOYMENT.md`.
