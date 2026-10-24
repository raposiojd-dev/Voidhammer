# Voidhammer — iOS app (Capacitor)

The game is one HTML page plus assets. This folder wraps it in a native iOS shell so it can go on the App Store.
Everything runs offline inside the app (fonts and images are bundled).

## What you need (I can't do these for you)
1. **Apple Developer Program** membership: US$99/year (developer.apple.com/programs). Approval can take a day or two.
2. **A Mac with Xcode 16+** (or rent one, e.g. a cloud Mac, for a day), or the GitHub Actions route below.
3. An **App Store Connect** record for the app (appstoreconnect.apple.com → Apps → +). Use the bundle ID `com.voidhammer.shatteredrealms`.

## Build on a Mac
```bash
git clone https://github.com/raposiojd-dev/Voidhammer.git game
cd game/app
npm install
./sync-web.sh ..          # copies the game into www/ (drops .webm, iOS uses .mp4)
npx cap sync ios
npx cap open ios          # opens Xcode
```
In Xcode: select the **App** target → Signing & Capabilities → tick *Automatically manage signing* → pick your Team.
Pick **Any iOS Device (arm64)** → **Product → Archive** → **Distribute App → App Store Connect → Upload**.
Then in App Store Connect: attach the build, paste in `store/LISTING.md`, add `store/screens/*.png`, answer age rating and privacy as written, and **Submit for Review**.
Test first with **TestFlight** (the same build shows up there within minutes) on your own iPhone.

## Updating the game later
Change the web game as usual, then repeat `./sync-web.sh .. && npx cap sync ios`, raise the build number in Xcode, archive and upload.
(Web and app saves are separate. Use the in-game Backup Code to move a save from the website to the app.)

## Things worth knowing
- iPhone only (no iPad), portrait and landscape.
- App Review guideline 4.2 rejects thin website wrappers. This one ships all its content inside the app, plus native splash, so it should pass; the review notes in LISTING.md explain it.
- Native text: inside the app the "Add to Home Screen" and "Safari" wording is replaced automatically.
- Memory/size: the app is about 190 MB. That is fine, but anyone on mobile data will be prompted before downloading over 200 MB, so avoid growing it much further.

## No Mac? Use GitHub Actions
Two workflows are already in `.github/workflows/` (GitHub repo > Actions tab > pick one > Run workflow):
- **ios-check**: builds the app unsigned on a cloud Mac. No Apple account needed. Proves it compiles.
- **ios-release**: signs and uploads to TestFlight. After your Developer account is approved:
  1. App Store Connect > Users and Access > Integrations > App Store Connect API > create a key (role: App Manager). Download the `.p8` once.
  2. Create the app record (bundle ID `com.voidhammer.shatteredrealms`).
  3. Repo > Settings > Secrets and variables > Actions, add `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (paste the whole .p8 text).
  4. Run **ios-release**. The build appears in TestFlight in a few minutes; then submit it for review as above.
