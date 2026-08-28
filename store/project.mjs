/**
 * Store-screenshot configuration for VpnHood! CONNECT.
 *
 * The screenshot engine lives in vpnhood/VpnHood.Client.WebUI; its built-in e2e/store/project.mjs
 * describes the CLIENT. This file is the CONNECT equivalent, passed to the engine through the
 * composite action's `project` input (see .github/workflows/update-screenshots.yml). The engine
 * itself is never edited — only this file and the fixture.json beside it.
 *
 * What makes Connect different from the Client, and where each difference comes from:
 *   - Connect ships a BUNDLED access key (the `AccessKeys` option in every Connect App.cs), so the
 *     Servers page shows a real location list. The Client ships none and shows add-a-key guidance.
 *   - IsAddAccessKeySupported = false (Connect.Win.Web/App.cs:22) and therefore
 *     IsPremiumFlagSupported = true (VpnHoodApp.cs:189) — the premium/free split is Connect's story.
 *   - features.uiName = "VpnHoodConnect" drives the SPA's whole visual identity: vuetify theme and
 *     logo (src/main.ts:26, src/components/NavigationDrawer.vue:114) plus isConnectApp() behaviour
 *     (src/services/VpnHoodApp.ts:339). It lives in fixture.json, not here.
 *
 * The fixture is the WINDOWS capability baseline (no ads, no billing — matching Connect.Win.Web and
 * Connect.Ios, neither of which registers an AdProvider or AccountProvider). Each platform below
 * overlays only what its own device class genuinely enables; values are traced to the app, never
 * invented.
 */
import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const here = path.dirname(url.fileURLToPath(import.meta.url));

// The engine's own checkout, for assets that ship with the engine rather than with this repo. The
// action runs store-screenshots.mjs with its working directory set to the action path (the WebUI
// checkout), so cwd IS the engine root. Resolved lazily inside prepare() — importing this file must
// stay dependency-free, because the workflow's `plan` job imports it in a checkout with no
// node_modules just to read LOCALES.
const engineRoot = () => process.cwd();

// A shared tilt reads as a deliberate treatment where a per-shot angle reads as drift. Straight-on
// is also the sharpest option: with no rotation there is no 3D subtree for Chromium to rasterize
// into a texture and resample.
export const ANGLE = { rotateX: 0, rotateY: 0, rotateZ: 0 };

/**
 * The store locales come from store-i18n/locales.json — the SAME file the text compiler reads — so
 * the screenshot set and the text set can never drift apart. `culture` (the SPA language, applied
 * through state.currentUiCultureInfo) is the one thing locales.json does not carry, so it is mapped
 * here and an unmapped tag fails the run rather than silently shooting English.
 */
const CULTURES = {
  'en-US': 'en', ar: 'ar', 'de-DE': 'de', 'es-ES': 'es', fa: 'fa', 'fr-FR': 'fr',
  'hi-IN': 'hi', 'it-IT': 'it', 'pt-BR': 'pt-BR', 'pt-PT': 'pt', 'ru-RU': 'ru',
  'tr-TR': 'tr', 'zh-CN': 'zh',
};

const localesFile = path.join(here, '..', 'store-i18n', 'locales.json');
export const LOCALES = JSON.parse(await fs.readFile(localesFile, 'utf8')).locales.map(locale => {
  const culture = CULTURES[locale.tag];
  if (!culture)
    throw new Error(`store-i18n/locales.json has locale "${locale.tag}" with no culture mapping in store/project.mjs.`);
  return { ...locale, culture };
});

/**
 * ConnectionInfo.vue renders `(speed * 10 / 1000000).toFixed(2)`, so 1 Mbps == 100_000 here. Only
 * ever use throughput the product actually sustains — it is a performance claim on a store page.
 */
const MBPS = 100_000;

const CONNECTED = {
  state: {
    connectionState: 'Connected',
    sessionStatus: { speed: { received: 108.7 * MBPS, sent: 82.4 * MBPS } },
  },
};

/**
 * Connect's differentiator, and the reason its Servers page is a headline shot rather than the
 * Client's add-a-key screen: the bundled profile in fixture.json carries the real published server
 * list. Android shows it whole (free and premium together — free IS the story on Google Play);
 * iOS substitutes a premium-only list via its platform patch, see IOS_LOCATION_INFOS.
 */
const SERVERS = { route: '/servers', label: 'Servers (bundled locations)' };

/**
 * iOS ships PREMIUM-ONLY (owner decision 2026-08-09: the iOS access token serves no free tier, and
 * the iOS listing text already says "does not include a free tier" — the screenshots must agree,
 * App Store review compares them against the app). Derived from the shared fixture rather than
 * duplicated, so the location list has one source of truth:
 *   - keep only the pure "#premium" locations (a no-free token would never serve the free or
 *     partial "~#premium" ones);
 *   - rebuild the rows the app itself derives (ClientServerLocationInfo.cs — options are NEVER
 *     hand-written, per the store README): the Auto/default row loses its free half
 *     (hasFree=false, normal=null) and its unblockable flag (no kept location carries one), and
 *     the two regions whose country wildcard disappeared with the free list (DE, US) are
 *     un-nested — a country with a single location renders as a plain country row;
 *   - the kept entries' own options are already correct for iOS: billing ON (premiumByPurchase
 *     via isBillingSupported), no rewarded ads (both *ByRewardedAd null), premiumByTrial set — a
 *     trial session is also what makes the connected Home shot honest for a non-premium viewer.
 */
const FIXTURE = JSON.parse(await fs.readFile(path.join(here, 'fixture.json'), 'utf8'));
const IOS_LOCATION_INFOS = (() => {
  const src = FIXTURE.clientProfileInfos[0].locationInfos;
  const kept = src
    .filter((l) => (l.tags ?? []).includes('#premium'))
    .map((l) => ({ ...l, isNestedCountry: false }));
  const auto = src.find((l) => l.isDefault);
  return [
    {
      ...auto,
      tags: ['#premium'],
      options: { ...auto.options, hasFree: false, hasUnblockable: false, normal: null },
    },
    ...kept,
  ];
})();

/**
 * The Apps Filter page calls GET /api/app/installed-apps, which on a real device returns the
 * installed apps with their icons. The mock answers with famous apps whose icons are SYNTHESIZED by
 * prepare() below from the Material Design Icons webfont that ships with the ENGINE (@mdi/font) —
 * the same recognizable brand glyphs, without committing anyone's icon artwork as fixture data.
 */
const DEMO_APPS = [
  { appId: 'com.android.vending', appName: 'Play Store', icon: 'google-play', bg: ['#fff'], fg: ['#00c4ff', '#00e59d'] },
  { appId: 'com.whatsapp', appName: 'WhatsApp', icon: 'whatsapp', bg: ['#25D366'], fg: ['#fff'] },
  { appId: 'com.android.calculator', appName: 'Calculator', icon: 'calculator', bg: ['#43A047'], fg: ['#fff'] },
  { appId: 'com.android.calendar', appName: 'Calendar', icon: 'calendar-month', bg: ['#1E88E5'], fg: ['#fff'] },
  { appId: 'com.android.camera', appName: 'Camera', icon: 'camera', bg: ['#E53935'], fg: ['#fff'] },
  { appId: 'com.android.chrome', appName: 'Chrome', icon: 'google-chrome', bg: ['#4285F4'], fg: ['#fff'] },
  { appId: 'com.android.deskclock', appName: 'Clock', icon: 'clock-outline', bg: ['#5C6BC0'], fg: ['#fff'] },
  { appId: 'com.facebook.katana', appName: 'Facebook', icon: 'facebook', bg: ['#1877F2'], fg: ['#fff'] },
  { appId: 'com.google.android.gm', appName: 'Gmail', icon: 'gmail', bg: ['#fff'], fg: ['#EA4335'] },
  { appId: 'com.instagram.android', appName: 'Instagram', icon: 'instagram', bg: ['#F58529', '#DD2A7B', '#8134AF'], fg: ['#fff'] },
  { appId: 'com.google.android.apps.maps', appName: 'Maps', icon: 'google-maps', bg: ['#fff'], fg: ['#34A853'] },
  { appId: 'com.spotify.music', appName: 'Spotify', icon: 'spotify', bg: ['#1DB954'], fg: ['#fff'] },
  { appId: 'com.google.android.youtube', appName: 'YouTube', icon: 'youtube', bg: ['#FF0000'], fg: ['#fff'] },
];

/**
 * Renders the demo app icons through the engine's Chromium and plants them on the fixture before
 * any capture runs. Deterministic on any machine: fixed colours, and the glyph font is inlined so
 * nothing depends on what the box has installed.
 */
export async function prepare(browser, fixture) {
  const mdiDir = path.join(engineRoot(), 'node_modules', '@mdi', 'font');
  // Resolve each glyph's codepoint from the installed @mdi/font CSS — fail loud on a miss.
  const mdiCss = await fs.readFile(path.join(mdiDir, 'css', 'materialdesignicons.css'), 'utf8');
  const codepoint = (name) => {
    const match = mdiCss.match(new RegExp(`\\.mdi-${name}::before\\s*\\{\\s*content:\\s*"\\\\([0-9A-F]+)"`));
    if (!match) throw new Error(`@mdi/font has no glyph named "${name}" — pick another in DEMO_APPS.`);
    return parseInt(match[1], 16);
  };
  const apps = DEMO_APPS.map(app => ({ ...app, glyph: codepoint(app.icon) }));

  const mdiFont = await fs.readFile(path.join(mdiDir, 'fonts', 'materialdesignicons-webfont.ttf'));
  const page = await browser.newPage();
  const icons = await page.evaluate(async ({ apps, fontB64 }) => {
    const face = new FontFace('MdiGlyphs', `url(data:font/ttf;base64,${fontB64})`);
    await face.load();
    document.fonts.add(face);

    const paint = (ctx, stops) => {
      if (stops.length === 1) return stops[0];
      const fill = ctx.createLinearGradient(0, 0, 96, 96);
      stops.forEach((stop, i) => fill.addColorStop(i / (stops.length - 1), stop));
      return fill;
    };

    return apps.map(app => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 96;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = paint(ctx, app.bg);
      ctx.fillRect(0, 0, 96, 96); // the app's list avatar clips to a circle itself
      ctx.fillStyle = paint(ctx, app.fg);
      ctx.font = '58px MdiGlyphs';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String.fromCodePoint(app.glyph), 48, 50);
      // The SPA prepends 'data:image/png;base64, ' itself (split-apps.vue), so strip the header.
      return canvas.toDataURL('image/png').split(',')[1];
    });
  }, { apps, fontB64: mdiFont.toString('base64') });
  await page.close();

  fixture.installedApps = apps.map((app, i) => ({
    appId: app.appId, appName: app.appName, iconPng: icons[i],
  }));
}

// "All except 2 apps": Play Store and WhatsApp ride outside the tunnel.
const APPS_FILTER = {
  route: '/split-tunneling/split-apps', label: 'Apps Filter',
  patch: { userSettings: { splitTunneling: { appMode: 'Exclude', apps: ['com.android.vending', 'com.whatsapp'] } } },
};

// The "IP Leak Risk" chip is an accurate in-app caution about a setting the user opts into (split
// tunneling exposes your IP to whatever you route around the tunnel — true of every VPN). Out of
// context on a store page it reads as a claim about the product. Hidden for the capture only; the
// app still shows it to anyone who turns the setting on.
const HIDE_LEAK_CHIP = ['.v-chip.text-warning'];

const IOS_DEVICES = {
  'iphone-6.9': {
    label: 'iPhone 6.9"',
    prefix: '',
    frame: 'phone',
    cssWidth: 430, cssHeight: 932, scale: 3,   // -> 1290x2796, Apple's required iPhone slot
    safeTop: 59, safeBottom: 34,
    screenW: 344,
    bezel: 9, outerRadius: 54, screenRadius: 46,
    island: { width: 86, height: 25 },
    statusFont: 11.5, statusPad: 26,
    indicatorWidth: 105,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  },
};

/**
 * AndroidDevice + AndroidDeviceUiProvider on a phone (every intent gate is `!IsTv` plus an API-level
 * floor the Play target exceeds). Connect's Google build additionally registers an AccountProvider
 * with a BillingProvider and AdProviderItems (Connect.Android.Google/App.cs:50-51), which the
 * Windows/iOS baseline in fixture.json does not have.
 *
 * Note the ad flags do NOT retro-fit the per-location `options` already computed in fixture.json
 * (ClientServerLocationInfo.cs derives premiumByRewardedAd from IsRewardedAdSupported at build
 * time, and a fixture patch is a deep merge, not a recompute). The locations therefore show their
 * no-rewarded-ad affordances — an understatement of what the Google build offers, never an
 * overstatement.
 */
const ANDROID_PATCH = {
  features: {
    osType: 'Android',
    isExcludeAppsSupported: true,              // AndroidDevice.IsExcludeAppsSupported => true
    isIncludeAppsSupported: true,
    isAccountSupported: true,                  // AccountProvider set  (App.cs:50)
    isBillingSupported: true,                  // ...with a BillingProvider (VpnHoodApp.cs:197)
    isAdSupported: true,                       // AdProviderItems non-empty (App.cs:51, VpnHoodApp.cs:212)
    isRewardedAdSupported: true,               // VpnHoodApp.cs:213
    isUserReviewSupported: true,               // GooglePlayInAppUserReviewProvider (App.cs:49)
    adjustForSystemBars: false,                // App.cs:53 — the SPA pads itself
  },
  intentFeatures: {
    isQuickLaunchSupported: true,              // AndroidDeviceUiProvider, API 24+ & !IsTv
    isRequestQuickLaunchSupported: true,
    isRequestNotificationSupported: true,      // API 33+ & !IsTv
    isPrivateDnsSettingsSupported: true,       // API 28+ & !IsTv
    isKillSwitchSettingsSupported: true,       // API 24+ & !IsTv
    isAlwaysOnSettingsSupported: true,         // API 24+ & !IsTv
    isSettingsSupported: true,
    isAppSettingsSupported: true,
    isAppNotificationSettingsSupported: true,
  },
  state: { isNotificationEnabled: true },
};

/**
 * Array order IS the store order — filenames number by position. The arc: proof first (connected,
 * real speeds), then Connect's own differentiator (the bundled server list, free and premium), then
 * Cloak Mode, then the visually self-explanatory features. Tech pages follow, niche last.
 *
 * Google Play accepts AT MOST 8 screenshots per device type — `--install` ships only the first 8
 * (installMax on the Play platforms).
 */
const ANDROID_SHOTS = [
  { route: '/', label: 'Home (connected)', patch: CONNECTED },
  SERVERS,
  { route: '/protocols/cloak-mode', label: 'Cloak Mode' },
  { route: '/protocols', label: 'Protocols' },
  APPS_FILTER,
  { route: '/split-tunneling', label: 'Split Tunneling', hide: HIDE_LEAK_CHIP },
  { route: '/settings/kill-switch', label: 'Kill Switch' },
  { route: '/settings/proxies', label: 'Proxies' },
  // --- everything below is generated but NOT installed: Play's cap is 8 per device type. ---
  { route: '/dns', label: 'DNS' },                       // shows the Private DNS card too
  { route: '/settings/always-on', label: 'Always On' },
  { route: '/settings/quick-launch', label: 'Quick Launch' },
];

/**
 * Where `--install` copies the finals. Every installDir is a path INSIDE this repo, with `<locale>`
 * standing for that store's locale folder; INSTALL_ROOT locates this checkout relative to the
 * ENGINE repo root, and `--install-root` overrides it (CI points it at this workspace).
 */
export const INSTALL_ROOT = '../Vpnhood.App.Connect';

/**
 * Release-notes config for store-release-notes.mjs: `product` picks which #client/#connect-tagged
 * CHANGELOG lines this app keeps. `ios: false` suppresses — and deletes — the
 * fastlane/metadata/ios/<locale>/release_notes.txt files, because Apple allows no "What's New" on
 * an app's FIRST App Store version and rejects a v1 submission that carries one. Flip it to true
 * once CONNECT 1.0 is live on the App Store.
 */
export const RELEASE_NOTES = { product: 'connect', ios: false };

export const PLATFORMS = {
  ios: {
    label: 'App Store',
    store: 'appStore',
    installDir: 'fastlane/screenshots/ios/<locale>',
    // iOS ships WITH StoreKit billing and premium-only servers (owner decisions 2026-08; the old
    // note here claiming a no-billing iOS baseline predates them). Besides osType and the
    // edge-to-edge WKWebView inset behaviour, the patch swaps in the premium-only location list —
    // clientProfileInfos is an ARRAY, and deepMerge replaces arrays wholesale, so the whole
    // profile is restated with only locationInfos changed.
    patch: {
      features: { osType: 'Ios', adjustForSystemBars: false },  // AppDelegate.cs:86
      clientProfileInfos: [{ ...FIXTURE.clientProfileInfos[0], locationInfos: IOS_LOCATION_INFOS }],
    },
    devices: IOS_DEVICES,
    // iOS copy must never name another platform (App Store Guideline 2.3.10) — no Google Play /
    // Android / Windows references reachable from these screens.
    shots: [
      { route: '/', label: 'Home (connected)', patch: CONNECTED },
      SERVERS,
      { route: '/protocols/cloak-mode', label: 'Cloak Mode' },
      { route: '/protocols', label: 'Protocols' },
      { route: '/split-tunneling', label: 'Split Tunneling', hide: HIDE_LEAK_CHIP },
      { route: '/dns', label: 'DNS' },
      { route: '/settings/proxies', label: 'Proxies' },
    ],
  },

  'android-phone': {
    label: 'Google Play',
    store: 'googlePlay',
    installDir: 'fastlane/metadata/android/<locale>/images/phoneScreenshots',
    installMax: 8,
    patch: ANDROID_PATCH,
    devices: {
      'android-phone': {
        label: 'Android',
        prefix: '',
        frame: 'phone',
        statusStyle: 'android',
        cssWidth: 360, cssHeight: 740, scale: 4,  // -> 1440x2960
        safeTop: 28, safeBottom: 20,
        screenW: 288,
        bezel: 4, outerRadius: 40, screenRadius: 36,  // slim rim: a modern Android is nearly all screen
        island: null, punchHole: { size: 12 },
        statusFont: 11, statusPad: 22,
        indicatorWidth: 96,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      },
    },
    shots: ANDROID_SHOTS,
  },

  'android-tv': {
    label: 'Google Play TV',
    store: 'googlePlay',
    installDir: 'fastlane/metadata/android/<locale>/images/tvScreenshots',
    installMax: 8,
    // AndroidDevice with AndroidUtils.IsTv() true: app split stays supported, but every
    // AndroidDeviceUiProvider intent is gated on !IsTv — so intentFeatures keep the fixture's
    // all-false baseline, and the SPA switches to its isTv layout.
    patch: {
      features: {
        osType: 'Android',
        isTv: true,
        isExcludeAppsSupported: true,
        isIncludeAppsSupported: true,
        isAccountSupported: true,
        isBillingSupported: true,
        isAdSupported: true,
        isRewardedAdSupported: true,
        adjustForSystemBars: false,
      },
    },
    devices: {
      'android-tv': {
        label: 'Android TV',
        prefix: '',
        // Bare on purpose even though the phone set is framed: a TV screenshot IS the full 16:9
        // panel — wrapping it in a TV bezel would just shrink the app into letterboxing.
        frame: 'none',
        // -> 1920x1080 landscape, the tvScreenshots size. 1280x720 CSS (a 720p/tvdpi-class panel)
        // rather than 960x540: both exist on real TVs, and the roomier one fits the whole home page.
        cssWidth: 1280, cssHeight: 720, scale: 1.5,
        safeTop: 0, safeBottom: 0,
        isMobile: false, hasTouch: false,
        userAgent: 'Mozilla/5.0 (Linux; Android 12; ADT-3) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
    },
    // No Apps Filter (FilterList is finger-driven and the page is not in the TV remote flow) and no
    // Kill Switch / Always On / Quick Launch (every one is gated `!IsTv`).
    shots: [
      { route: '/', label: 'Home (connected)', patch: CONNECTED },
      SERVERS,
      { route: '/protocols/cloak-mode', label: 'Cloak Mode' },
      { route: '/protocols', label: 'Protocols' },
      { route: '/split-tunneling', label: 'Split Tunneling', hide: HIDE_LEAK_CHIP },
      { route: '/dns', label: 'DNS' },
      { route: '/settings/proxies', label: 'Proxies' },
    ],
  },
};

/**
 * Endpoints the mock answers, on top of the (platform-patched) fixture. The SPA's startup path is
 * POST /api/app/configure followed by GET /api/app/state polling; everything else is per-page.
 * Unmatched /api/** calls are logged by the engine rather than silently 404ing, so a screen that
 * starts needing a new endpoint shows up as a warning instead of a broken screenshot.
 */
export const ROUTES = {
  'POST /api/app/configure': (fixture) => fixture,
  // Returns the whole AppConfig, not void: answering null here wipes features on the client and
  // VpnHoodApp.getVersion() then throws on `fullVersion.split('.')`, which cascades into an error
  // dialog over the screenshot.
  'PATCH /api/app/configure': (fixture) => fixture,
  'GET /api/app/config': (fixture) => fixture,
  'GET /api/app/state': (fixture) => fixture.state,
  'GET /api/client-profiles': (fixture) => fixture.clientProfileInfos,
  'GET /api/app/installed-apps': (fixture) => fixture.installedApps ?? [],
  'PUT /api/app/user-settings': () => null, // void
};
