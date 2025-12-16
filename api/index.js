import fetch from "node-fetch";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID;

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

/* ================= TELEGRAM ================= */
async function tg(text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT,
      text,
    }),
  });
}

/* ================= MAIN ================= */
export default async function handler(req, res) {

  /* ========= ADMIN COMMANDS ========= */
  if (req.method === "POST" && req.body?.message) {
    const msg = req.body.message;
    if (msg.chat.id != ADMIN_CHAT) return res.json({ ok: true });

    const text = msg.text || "";

    /* ===== ADD PLAN ===== */
    if (text.startsWith("/addplan")) {
      // format: /addplan Silver 500
      const [, name, price] = text.split(" ");

      await fetch(`${SUPABASE_URL}/rest/v1/plans`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, price }),
      });

      await tg(`✅ Plan added\nName: ${name}\nPrice: ₹${price}`);
    }

    /* ===== DELETE PLAN ===== */
    if (text.startsWith("/delplan")) {
      // format: /delplan PLAN_ID
      const [, id] = text.split(" ");

      await fetch(`${SUPABASE_URL}/rest/v1/plans?id=eq.${id}`, {
        method: "DELETE",
        headers,
      });

      await tg("🗑️ Plan deleted");
    }

    /* ===== DISABLE PLAN ===== */
    if (text.startsWith("/disableplan")) {
      const [, id] = text.split(" ");

      await fetch(`${SUPABASE_URL}/rest/v1/plans?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "disabled" }),
      });

      await tg("🚫 Plan disabled");
    }

    /* ===== ENABLE PLAN ===== */
    if (text.startsWith("/enableplan")) {
      const [, id] = text.split(" ");

      await fetch(`${SUPABASE_URL}/rest/v1/plans?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "active" }),
      });

      await tg("✅ Plan enabled");
    }

    /* ===== ADD BALANCE ===== */
    if (text.startsWith("/addbal")) {
      // /addbal USER_ID 100
      const [, uid, amt] = text.split(" ");

      await fetch(`${SUPABASE_URL}/rest/v1/balances?user_id=eq.${uid}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ ammount: `ammount + ${amt}` }),
      });

      await tg(`💰 ₹${amt} added to user`);
    }

    /* ===== DEDUCT BALANCE ===== */
    if (text.startsWith("/minusbal")) {
      // /minusbal USER_ID 50
      const [, uid, amt] = text.split(" ");

      await fetch(`${SUPABASE_URL}/rest/v1/balances?user_id=eq.${uid}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ ammount: `ammount - ${amt}` }),
      });

      await tg(`➖ ₹${amt} deducted from user`);
    }

    return res.json({ ok: true });
  }

  res.status(404).end();
}