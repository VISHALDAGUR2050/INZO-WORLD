import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ===== CONFIG ===== */
const supabase = createClient(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
);

function el(id) {
  return document.getElementById(id);
}

/* ===== REGISTER ===== */
window.register = async () => {
  const name = el("name").value;
  const mobile = el("mobile").value;
  const password = el("password").value;
  const ref = el("ref").value || null;

  const email = `${mobile}@inzo.app`;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);

  await supabase.from("users").insert({
    id: data.user.id,
    name,
    mobile,
    referral_code: mobile,
    referred_by: ref,
  });

  await supabase.from("balances").insert({
    user_id: data.user.id,
    ammount: 0,
  });

  alert("Account created");
  location.href = "/login.html";
};

/* ===== LOGIN ===== */
window.login = async () => {
  const mobile = el("mobile").value;
  const password = el("password").value;
  const email = `${mobile}@inzo.app`;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  location.href = "/profile.html";
};

/* ===== PROFILE ===== */
window.loadProfile = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return location.href = "/login.html";

  const uid = data.session.user.id;

  const { data: bal } = await supabase
    .from("balances")
    .select("ammount")
    .eq("user_id", uid)
    .single();

  el("bal").innerText = bal?.ammount || 0;
};

/* ===== DEPOSIT ===== */
window.deposit = async () => {
  const { data } = await supabase.auth.getSession();
  const user = data.session.user;

  const amount = el("amount").value;
  const utr = el("utr").value;
  const file = el("ss").files[0];

  const { data: up } = await supabase.storage
    .from("deposit_screenshots")
    .upload(`${user.id}/${Date.now()}.png`, file);

  await fetch("/api/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      amount,
      utr,
      screenshot: up.path,
    }),
  });

  alert("Deposit submitted");
};

/* ===== WITHDRAW ===== */
window.withdraw = async () => {
  const { data } = await supabase.auth.getSession();
  const user = data.session.user;

  const amount = el("amount").value;
  const method = el("method").value;
  const details = el("details").value;

  const r = await fetch("/api/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      amount,
      method,
      details,
    }),
  });

  const j = await r.json();
  if (j.error) return alert(j.error);

  alert("Withdraw submitted");
};

/* ===== LOGOUT ===== */
window.logout = async () => {
  await supabase.auth.signOut();
  location.href = "/login.html";

  /* ===== LOAD PLANS ===== */
window.onload = async () => {
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("status", "active");

  const box = document.getElementById("plans");
  if (!box) return;

  plans.forEach(p => {
    box.innerHTML += `
      <div class="card">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="location.href='/deposit.html'">Buy</button>
      </div>
    `;
  });
};
}