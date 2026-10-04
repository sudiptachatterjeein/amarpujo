# Puja Map 2026 · v5 (with paid community chat "Puja Adda")

Static site + small Vercel functions. Deploy on **Vercel** (no build step). Database = **Supabase**.

## What is in this folder (all at the ROOT of your GitHub repo)
```
index.html  admin.html  manifest.webmanifest  sw.js  vercel.json  package.json
assets/   api/   supabase-schema.sql  supabase-photos.sql  supabase-chat.sql
```

## 1. Supabase  (SQL Editor > New query, one file at a time, wait for "Success" each time)
1. `supabase-schema.sql`  (skip if you already ran it)
2. `supabase-photos.sql`  (skip if already run)
3. **`supabase-chat.sql`**  <- new: creates the chat tables and functions
4. Authentication > Users > add your admin email + password (skip if done)
5. Run once, with your real email (skip if done):
   `insert into public.admins (email) values (lower('YOU@EMAIL.COM')) on conflict do nothing;`

## 2. GitHub
Upload the CONTENTS of this folder (not an extra outer folder) and commit.
The repo's front page must show `index.html`, `vercel.json`, `assets`, `api`.

## 3. Vercel
1. vercel.com > Add New > Project > import the repo.
2. Framework Preset: **Other**. Build Command and Output Directory: empty. Deploy.
3. Every later GitHub commit redeploys automatically.
4. (Optional AI box) Settings > Environment Variables > `ANTHROPIC_API_KEY`, then Redeploy.

## 4. Chat business settings  (`assets/config.js`, edit on GitHub with the pencil icon)
| Setting | Meaning |
|---|---|
| `CHAT_PAY_URL` | Page where people pay (currently your Buy Me a Chai page) |
| `CHAT_PRICE_LABEL` | Shown in step 1, e.g. `"Rs 99"`. Leave `""` to hide the price |
| `CHAT_CONTACT_URL` | Where people send the payment screenshot, e.g. `"https://wa.me/919XXXXXXXXX"` (or `mailto:` / `https://t.me/...`). `""` hides the button |

## 5. How the chat business works day to day
1. Customer: opens **Puja Adda** (Home card or More tab) > **Get your ID** > pays on your page > sends you the screenshot.
2. You: open `yoursite.vercel.app/admin`, sign in, scroll to **Create chat ID**. Type a note (payment ref + their phone number),
   pick the expiry date, click **Create & activate**. Click **Send on WhatsApp** (it opens WhatsApp to their number with the ID text ready).
3. Customer: enters the ID > chooses a nickname > chats. An ID works on 2 devices; "Leave chat" frees a slot; you can **Reset devices**.
4. Moderation: members tap a message > Report. Reports appear in the admin page: Delete message / Dismiss / Delete & block member.
   You can also Mute, Block, or extend (+7 days) any ID. IDs stop working automatically on the expiry date.

Safety built in: IDs are 10 random characters; 12 wrong guesses from one connection locks that connection for 10 minutes;
messages with links, @handles or phone numbers are rejected; 1 message per 2 seconds, 40 per 10 minutes.

## 6. Check it works
- Home shows the "Puja Adda" card. Open it: "Enter your ID" screen and the Get your ID steps.
- Admin > create an ID > enter it in the app > nickname > send a message from one phone, see it on another within ~5 seconds.

## Notes
- Chat refreshes every 5 seconds while open. Supabase's free plan comfortably handles a few hundred people chatting at once;
  for thousands, upgrade the Supabase plan.
- Payments are manual (UPI/Buy Me a Chai + screenshot). Keep records for your accounts; add a short refund/terms line on your payment page.
- Set `MAHALAYA_STREAM_URL` / `SITE_URL` etc. in `assets/config.js` as before.
