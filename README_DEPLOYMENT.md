# Puja Map 2026 · v6: two themes, free chat until 9 Oct, "Add your puja"

Static site + small Vercel functions. Deploy on **Vercel** (no build step). Database = **Supabase**.

## What is new in this version
1. **Two Durga Puja themes**: *Pujo Night* (dark, default) and *Laal Paar* (light: ivory white with vermilion red, like a red-bordered saree). Switch with the sun/moon button on Home, or More > Theme. The choice is remembered.
2. **Free chat until 9 Oct 11:59 PM IST**: anyone can create their own ID in the app (nickname only, no payment). After that only paid IDs you create in the admin page work. You can move the end date from the admin page.
3. **Add your puja**: visitors add a puja with name, location (GPS or Google Maps link) and a photo. It appears in Explore > Community pujas only after you approve it in the admin page.

## Files (all at the ROOT of your GitHub repo)
```
index.html  admin.html  manifest.webmanifest  sw.js  vercel.json  package.json
assets/   api/   supabase-schema.sql  supabase-photos.sql  supabase-chat.sql  supabase-pujas.sql
```

## 1. Supabase (SQL Editor > New query, one file at a time, wait for "Success")
1. `supabase-schema.sql` and `supabase-photos.sql`: only if you never ran them.
2. **`supabase-chat.sql`**: run it again even if you ran it before (it is safe; it adds free IDs and the free window).
3. **`supabase-pujas.sql`**: new, for "Add your puja".
4. Admin user + admins row (skip if done): `insert into public.admins (email) values (lower('YOU@EMAIL.COM')) on conflict do nothing;`

## 2. GitHub, then Vercel
Upload the CONTENTS of this folder (not an extra outer folder) and commit. Vercel redeploys automatically.
(New project: Add New > Project > import the repo > Framework **Other** > no build command > Deploy.)

## 3. Admin page (`yoursite.vercel.app/admin`)
- **Free chat window**: shows when free chat ends; change the date and press Save (free IDs follow the new date).
- **Create chat ID**: for paid members after they pay (as before).
- **Community pujas**: Pending list with photo, map link and the sender's name. Approve / Reject / Delete.
- **Members**: each row shows free or paid, status, expiry, devices. Mute, Block, +7 days, Reset devices.

## 4. Settings you can change in `assets/config.js`
`CHAT_PAY_URL`, `CHAT_PRICE_LABEL`, `CHAT_CONTACT_URL` (see the comments in that file).

## 5. Check it works
- Home: theme button (sun/moon) switches the whole app between dark and light.
- Home > Puja Adda card shows "Free until Fri 9 Oct". Open it: "Create your free ID", enter a nickname, copy the ID, start chatting.
- Explore > Community pujas > Add your puja: fill the form with a photo and location. Then approve it in /admin and it appears.

## Notes
- Free IDs are limited to 1 per phone and 5 per internet connection per day. Each ID works on 2 devices.
- Puja submissions: 3 per phone and 10 per connection per day. Photos are shrunk on the phone before upload.
- To end free chat early or extend it, change the date in the admin page. No code change needed.
