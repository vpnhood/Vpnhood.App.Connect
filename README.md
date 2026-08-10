# VpnHood! CONNECT — releases and store assets

This repo holds everything **around** the app: its releases, its store listing, and the settings the
shipped app reads at runtime. It contains **no source code** — that lives in
[vpnhood/VpnHood](https://github.com/vpnhood/VpnHood).

Looking for the app? [Releases](https://github.com/vpnhood/Vpnhood.App.Connect/releases) ·
[Google Play](https://play.google.com/store/apps/details?id=com.vpnhood.connect.android)

## What is in here

| Path | What it is | Who writes it |
| --- | --- | --- |
| `fastlane/` | Compiled store trees — texts and screenshots for Google Play and the App Store | Generated. Never hand-edit |
| `store-i18n/` | The source texts, one folder per locale | **`en-US/store.json` by hand**; the other 12 by vhtranslator |
| `store/project.mjs` | Which locales, devices and pages get shot, and where they install | By hand |
| `store/fixture.json` | The mocked app state screenshots render against — never real keys or accounts | By hand |
| `vh_translator/` | Translator config, prompt, and watch files that make translation incremental | By hand |
| `remote-settings.json` | Live config the **shipped app** fetches: in-app promotion and ad flag | By hand |
| `promotions/` | The banner images `remote-settings.json` points at, served raw from this repo | By hand |

`remote-settings.json` is the one file here that changes behaviour in apps already installed on
people's phones, with no release involved. Treat it accordingly. `remote-settings-debug.json` is the
same thing for debug builds.

## Workflows

Everything runs on GitHub Actions. Do not build the `.ipa`/AAB/MSI or run fastlane from a developer
machine — the runners hold the signing keys, the toolchains and the store credentials.

| Workflow | Does | Trigger |
| --- | --- | --- |
| `connect_publish.yml` | Builds Linux/Windows/Android/iOS, uploads to Google Play and TestFlight, creates the GitHub release here | Usually `pub/Connect/PublishByGithub.ps1` in the monorepo, which bumps the version first |
| `update-screenshots.yml` | Regenerates every screenshot and recompiles the texts, one locale per runner, and commits the result here | Manual. Pass the WebUI ref the shipped app actually uses |
| `publish_listing.yml` | Pushes texts and screenshots to Google Play and the App Store | Manual. Skips any store whose content is byte-identical to the last publish |

All three are thin wrappers: the real definitions live in the monorepo. A reusable workflow runs in
its **caller's** context, so they read this repo's assets and push with this repo's own token — which
is why no cross-repo credential exists anywhere in the chain.

iOS binaries currently go to **TestFlight only**. The App Store *listing* is published normally.

## Making a change

- **Store text** — edit `store-i18n/en-US/store.json`, run `update-screenshots.yml` (translates and
  compiles), then `publish_listing.yml`.
- **Screenshot pages, order or devices** — edit `store/project.mjs`, then the same two workflows.
  Array order is store order.
- **Promotion banner** — add the image under `promotions/`, point `remote-settings.json` at it. Live
  immediately, no release.
- **App behaviour, features, UI** — wrong repo. Go to
  [vpnhood/VpnHood](https://github.com/vpnhood/VpnHood).

Anything under `fastlane/` and `store-i18n/<non-en>/` is generated: hand-edits are silently
overwritten by the next run.

## Gotchas

- **The first App Store version needs two listing runs** — once with `skip_metadata=true`, then once
  with `skip_screenshots=true`. A fastlane/spaceship bug aborts the combined push. See the
  `publish_listing.yml` header.
- **The listing locks while a version is in review.** The publish warns and skips rather than
  failing, and picks it up once a version opens again.
- **Screenshots are regenerated wholesale**, so every run rewrites all of them. History was rewritten
  on 2026-08-08 to drop superseded image blobs; a clone is far smaller than it used to be.

The full maintainer's map of the screenshot and listing pipeline — how the tools fit together, the
invariants, and how to verify a change — lives in
[`e2e/store/README.md`](https://github.com/vpnhood/VpnHood.Client.WebUI/blob/main/e2e/store/README.md)
in the WebUI repo, which owns the tooling.
