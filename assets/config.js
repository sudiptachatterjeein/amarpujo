/* Puja Map 2026 - site settings. Everything here is PUBLIC (it ships to the browser). Never put secret keys here. */
window.PUJA_CONFIG = {
  // Supabase (public anon key only)
  SUPABASE_URL: "https://obrtopvixqemwhvzadda.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icnRvcHZpeHFlbXdodnphZGRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NDIxNTEsImV4cCI6MjEwNjMxODE1MX0.YC39Z36MBaQ2twujKKIcU3otvmYLbF_h1mV7pxTTKAA",

  // Mahalaya (10 Oct 2026, 4:00 AM IST).
  // MAHALAYA_PAGE_URL: opens in a new tab (works for everyone).
  // MAHALAYA_STREAM_URL: OPTIONAL direct audio file/stream (mp3/aac/m3u8) you have the right to play. If set, the app plays it in-app and can auto-start it at 4:00 AM.
  MAHALAYA_PAGE_URL: "https://audio.com/chandan-roy-1/audio/mahalaya-original-chandi-path-birendra-krishna-bhadra-full-chandipath-yqfn",
  MAHALAYA_STREAM_URL: "",
  MAHALAYA_START: "2026-10-10T04:00:00+05:30",

  // Support button / QR sheet
  SUPPORT_URL: "https://www.buymeachai.in/sudiptachatterjee.work",
  SUPPORT_QR: "/assets/support-qr.png",

  // Paid community chat ("Puja Adda").
  // CHAT_PAY_URL: the page where people pay. CHAT_PRICE_LABEL: shown in the steps, e.g. "Rs 99" (leave "" to hide).
  // CHAT_CONTACT_URL: where people send the payment screenshot, e.g. "https://wa.me/91XXXXXXXXXX" or "mailto:you@example.com" or "https://t.me/yourname" ("" hides the button).
  CHAT_PAY_URL: "https://www.buymeachai.in/sudiptachatterjee.work",
  CHAT_PRICE_LABEL: "",
  CHAT_CONTACT_URL: "",

  // Live weather (Open-Meteo, free, no key). Kolkata centre.
  WEATHER_LAT: 22.5726,
  WEATHER_LON: 88.3639,

  // Optional AI planner (Vercel function /api/concierge, needs ANTHROPIC_API_KEY on Vercel). Set "" to hide.
  AI_ENDPOINT: "/api/concierge"
};
