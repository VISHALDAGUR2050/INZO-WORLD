const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TG_TOKEN = process.env.TELEGRAM_TOKEN;
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID;

const headers = {
  "Content-Type": "application/json",
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function tg(text, buttons = null) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT,
      text,
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  });
}

export default async function handler(req, res) {
  try {
    /* ===== TEST ===== */
    if (req.method === "GET") {
      return res.status(200).send("INZO API RUNNING ✅");
    }

    /* ===== DEPOSIT CREATE ===== */
    if (req.url === "/api/deposit") {
      const { user_id, amount, utr, screenshot } = req.body;

      await fetch(`${SUPABASE_URL}/rest/v1/deposits`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id, amount, utr, screenshot }),
      });

      await tg(
        `💰 NEW DEPOSIT\nUser: ${user_id}\n₹${amount}\nUTR: ${utr}`,
        [[
          { text: "✅ Approve", callback_data: `d_ok:${user_id}:${amount}` },
          { text: "❌ Reject", callback_data: `d_no:${user_id}` },
        ]]
      );

      return res.json({ ok: true });
    }

    /* ===== WITHDRAW CREATE ===== */
    if (req.url === "/api/withdraw") {
      const { user_id, amount, method, details } = req.body;

      const balRes = await fetch(
        `${SUPABASE_URL}/rest/v1/balances?user_id=eq.${user_id}`,
        { headers }
      );
      const bal = (await balRes.json())[0];

      if (!bal || Number(bal.ammount) < Number(amount)) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      await fetch(`${SUPABASE_URL}/rest/v1/withdraws`, {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id, amount, method, details }),
      });

      await tg(
        `💸 WITHDRAW\nUser: ${user_id}\n₹${amount}`,
        [[
          { text: "✅ Approve", callback_data: `w_ok:${user_id}:${amount}` },
          { text: "❌ Reject", callback_data: `w_no:${user_id}` },
        ]]
      );

      return res.json({ ok: true });
    }

    /* ===== TELEGRAM CALLBACK ===== */
    if (req.body?.callback_query) {
      const q = req.body.callback_query;
      const [type, uid, amt] = q.data.split(":");
      const amount = Number(amt || 0);

      if (type === "d_ok") {
        const b = await fetch(`${SUPABASE_URL}/rest/v1/balances?user_id=eq.${uid}`, { headers });
        const cur = (await b.json())[0];

        await fetch(`${SUPABASE_URL}/rest/v1/balances?user_id=eq.${uid}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ ammount: Number(cur.ammount) + amount }),
        });

        await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: uid,
            title: "Deposit Approved",
            body: `₹${amount} added`,
          }),
        });

        await tg("✅ Deposit Approved");
      }

      if (type === "w_ok") {
        const b = await fetch(`${SUPABASE_URL}/rest/v1/balances?user_id=eq.${uid}`, { headers });
        const cur = (await b.json())[0];

        await fetch(`${SUPABASE_URL}/rest/v1/balances?user_id=eq.${uid}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ ammount: Number(cur.ammount) - amount }),
        });

        await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            user_id: uid,
            title: "Withdraw Approved",
            body: `₹${amount} withdrawn`,
          }),
        });

        await tg("✅ Withdraw Approved");
      }

      if (type.endsWith("_no")) {
        await tg("❌ Rejected");
      }

      return res.json({ ok: true });
    }

    res.status(404).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
}