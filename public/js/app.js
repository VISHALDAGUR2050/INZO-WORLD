import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= CONFIG ================= */
const SUPABASE_URL = "https://eppujqdqknulwbbycglb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcHVqcWRxa251bHdiYnljZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NzEwMzMsImV4cCI6MjA4MTQ0NzAzM30.vBoeDcWu_ZVE8ZejlzDgq_6n73P0IBSISmwcaF4rRuo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const el = (id) => document.getElementById(id);

/* ================= AUTH ================= */

// REGISTER
window.register = async () => {
  const name = el("name").value.trim();
  const mobile = el("mobile").value.trim();
  const password = el("password").value.trim();
  const ref = el("ref") ? el("ref").value.trim() : null;

  if (!name || !mobile || !password) {
    alert("All fields required");
    return;
  }

  const email = `${mobile}@inzo.app`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  await supabase.from("users").insert({
    id: data.user.id,
    name,
    mobile,
    referral_code: mobile,
    referred_by: ref || null,
  });

  await supabase.from("balances").insert({
    user_id: data.user.id,
    ammount: 0,
  });

  alert("Account created, please login");
  location.href = "/login.html";
};

// LOGIN
window.login = async () => {
  const mobile = el("mobile").value.trim();
  const password = el("password").value.trim();
  const email = `${mobile}@inzo.app`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  location.href = "/profile.html";
};

// LOGOUT
window.logout = async () => {
  await supabase.auth.signOut();
  location.href = "/login.html";
};

/* ================= PROFILE ================= */

window.loadProfile = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    location.href = "/login.html";
    return;
  }

  const uid = data.session.user.id;

  const { data: bal } = await supabase
    .from("balances")
    .select("ammount")
    .eq("user_id", uid)
    .single();

  if (el("bal")) {
    el("bal").innerText = bal?.ammount || 0;
  }
};

/* ================= DEPOSIT ================= */

window.deposit = async () => {
  const { data } = await supabase.auth.getSession();
  const user = data.session.user;

  const amount = el("amount").value;
  const utr = el("utr").value;
  const file = el("ss").files[0];

  if (!amount || !utr || !file) {
    alert("All fields required");
    return;
  }

  const upload = await supabase.storage
    .from("deposit_screenshots")
    .upload(`${user.id}/${Date.now()}.png`, file);

  if (upload.error) {
    alert("Upload failed");
    return;
  }

  const res = await fetch("/api/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      amount,
      utr,
      screenshot: upload.data.path,
    }),
  });

  const r = await res.json();
  if (r.error) {
    alert(r.error);
  } else {
    alert("Deposit submitted, wait for approval");
  }
};

/* ================= WITHDRAW ================= */

window.withdraw = async () => {
  const { data } = await supabase.auth.getSession();
  const user = data.session.user;

  const amount = el("amount").value;
  const method = el("method").value;
  const details = el("details").value;

  if (!amount || !method || !details) {
    alert("All fields required");
    return;
  }

  const res = await fetch("/api/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      amount,
      method,
      details,
    }),
  });

  const r = await res.json();
  if (r.error) {
    alert(r.error);
  } else {
    alert("Withdraw request submitted");
  }
};

/* ================= MESSAGES ================= */

window.loadMessages = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;

  const uid = data.session.user.id;

  const { data: msgs } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  const box = el("messages");
  if (!box) return;

  box.innerHTML = "";

  msgs.forEach((m) => {
    box.innerHTML += `
      <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px">
        <b>${m.title}</b>
        <p>${m.body}</p>
      </div>
    `;
  });
};

/* ================= PLANS (HOME) ================= */

window.loadPlans = async () => {
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("status", "active");

  const box = el("plans");
  if (!box) return;

  box.innerHTML = "";

  plans.forEach((p) => {
    box.innerHTML += `
      <div class="card">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="location.href='/deposit.html'">Buy</button>
      </div>
    `;
  });
};