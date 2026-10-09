# Puja Map 2026 · v7: two themes, free chat with mobile-number accounts, "Add your puja"

Static site + small Vercel functions. Deploy on **Vercel** (no build step). Database = **Supabase**.

## What is new in this version
1. **Two Durga Puja themes**: *Pujo Night* (dark, default) and *Laal Paar* (light: ivory white with vermilion red, like a red-bordered saree). Switch with the sun/moon button on Home, or More > Theme. The choice is remembered.
2. **Free chat until 16 Oct 11:59 PM IST**: anyone can create a free account in the app with a nickname, **mobile number and a 4-6 digit PIN**, and sign in again on any phone with the same number and PIN. After the end date only paid IDs you create in the admin page work. You can move the end date from the admin page.
3. **Add your puja**: visitors add a puja with name, location (GPS or Google Maps link) and a photo. It appears in Explore > Community pujas only after you approve it in the admin page.

## Files (all at the ROOT of your GitHub repo)
```
index.html  admin.html  manifest.webmanifest  sw.js  vercel.json  package.json
assets/   api/   supabase-schema.sql  supabase-photos.sql  supabase-chat.sql  supabase-pujas.sql
```

## 1. Supabase (SQL Editor > New query, one file at a time, wait for "Success")
1. `supabase-schema.sql` and `supabase-photos.sql`: only if you never ran them.
2. **`supabase-chat.sql`**: **run it again even if you ran it before** (it is safe to repeat). It adds the free window and the mobile-number accounts. If this file is not up to date, the free sign-up cannot work.
3. **`supabase-pujas.sql`**: new, for "Add your puja".
4. Admin user + admins row (skip if done): `insert into public.admins (email) values (lower('YOU@EMAIL.COM')) on conflict do nothing;`

## 2. GitHub, then Vercel
Upload the CONTENTS of this folder (not an extra outer folder) and commit. Vercel redeploys automatically.
(New project: Add New > Project > import the repo > Framework **Other** > no build command > Deploy.)

## 3. Admin page (`yoursite.vercel.app/admin`)
- **Setup check**: press *Run check*. It shows which SQL files are missing in Supabase (use this first if something does not appear in the app).
- **Free chat window**: shows when free chat ends; change the date and press Save (free IDs follow the new date).
- **Create chat ID**: for paid members after they pay (as before).
- **Community pujas**: Pending list with photo, map link and the sender's name. Approve / Reject / Delete.
- **Members**: each row shows the mobile number, free or paid, status, expiry, devices. Mute, Block, +7 days, **Reset PIN** (for people who forgot it), Reset devices.

## 4. Settings you can change in `assets/config.js`
`CHAT_PAY_URL`, `CHAT_PRICE_LABEL`, `CHAT_CONTACT_URL` (see the comments in that file).

## 5. Check it works
- Home: theme button (sun/moon) switches the whole app between dark and light.
- Home > Puja Adda card shows "Free until Fri 16 Oct". Open it: *Create account* (nickname, mobile number, PIN) and you are in the chat. On another phone use *Sign in* with the same number and PIN.
- Explore > Community pujas > Add your puja: fill the form with a photo and location. Then approve it in /admin and it appears.

## Notes
- Free accounts: 5 per internet connection per day, one account per mobile number. 5 wrong PINs lock that number for 15 minutes. Each account works on 2 devices.
- Numbers are NOT verified by SMS (that needs a paid SMS service). The PIN protects the account. Numbers are visible only to you in the admin page; keep them private and mention this in your privacy note.
- Puja submissions: 3 per phone and 10 per connection per day. Photos are shrunk on the phone before upload.
- To end free chat early or extend it, change the date in the admin page. No code change needed.

## Mahalaya auto-play (v10)
- `assets/mahalaya.mp3` is the broadcast (compressed to about 22 MB so it uploads to GitHub from the browser). `MAHALAYA_STREAM_URL` in `assets/config.js` points to it.
- Visitors tap **Alert me at 4 AM** once. That tap unlocks sound; the app then starts the audio by itself at 4:00 AM IST (10 Oct 2026) while the app is open. If the phone blocks it, a "Tap to start" banner appears and the first tap anywhere starts it.
- **Rehearse before the real day:** open `yoursite.vercel.app/?mhtest=2`, tap *Alert me*, wait 2 minutes. Mahalaya should start by itself. (Rehearsal lasts for that browser session only.)
- Do not use `?v=` cache numbers older than 10 for the files; `sw.js` is now `puja26-v10`.

## New in v11
- **Pandal Passport** (Home): badge levels from "Pujo Newbie" to "Maha Pandal-Wallah" based on pandals marked visited, plus a button that makes a shareable image card (WhatsApp share, or saved as a PNG).
- **Pujo Roulette** (Home): spins and picks a random pandal (unvisited ones in the current region first) and opens its details.
- **Mahalaya player**: seek bar, -15s / +15s, and a "Live" button to jump to the live position.
- **Shubho Mahalaya celebration**: a full-screen petal and diya animation the first time the audio starts.
- Files changed: `assets/extras.js` (new), `assets/mahalaya.js`, `assets/views-home.js`, `assets/app.css`, `index.html`, `sw.js` (now `puja26-v11`).

## New in v12
- **Immersive Mahalaya** (button on the Mahalaya card): full-screen rotating mandala with a progress ring, big timer, play/pause, seek and -15s/+15s. Tap anywhere to light a diya. The screen stays awake while it is open.
- **Dhaak Jam** (Home): four pads (dhaak, kathi, kansor, shankh) and an auto rhythm. All sounds are generated in the phone, so there are no extra audio files.
- Files changed: `assets/immersive.js` (new), `assets/extras.js`, `assets/views-home.js`, `assets/app.css`, `index.html`, `sw.js` (now `puja26-v12`).

## v13: more realistic Dhaak Jam
- The synth was rebuilt: deep bass boom, fast stick rolls on the treble head, bright kansor, small ghonta, and a pandal-like reverb. The auto rhythm now schedules on the audio clock, so it stays steady, and uses a 32-step aarti-style groove.
- **For the real Bengali dhaak sound, add recordings** (any phone recording from a pandal, trimmed and compressed as mp3):
  - `assets/dhaak.mp3`: one single dhaak boom (about 1 second). The Dhaak pad and the rhythm's boom then use it.
  - `assets/dhaak-loop.mp3`: a clean 10 to 20 second loop of real dhaak. "Auto rhythm" then plays this loop instead of the synth pattern.
  If the files are missing, the app quietly uses the synth.
