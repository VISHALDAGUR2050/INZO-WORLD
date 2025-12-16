// ================= SUPABASE CONFIG =================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://eppujqdqknulwbbycglb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcHVqcWRxa251bHdiYnljZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NzEwMzMsImV4cCI6MjA4MTQ0NzAzM30.vBoeDcWu_ZVE8ZejlzDgq_6n73P0IBSISmwcaF4rRuo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================= HELPERS =================
function qs(id) {
  return document.getElementById(id);
}

// ================= REGISTER =================
window.register = async function () {
  const name = qs("name").value;
  const mobile = qs("mobile").value;
  const password = qs("password").value;
  const ref = qs("ref").value || null;

  if (!name || !mobile || !password) {
    alert("All fields required");
    return;
  }

  // Email fake bana rahe hain (OTP / email nahi chahiye)
  const email = `${mobile}@inzo.app`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  // extra user data
  await supabase.from("users").insert({
    id: data.user.id,
    name,
    mobile,
    referred_by: ref,
  });

  alert("Account created. Login now.");
  location.href = "/login.html";
};

// ================= LOGIN =================
window.login = async function () {
  const mobile = qs("mobile").value;
  const password = qs("password").value;

  const email = `${mobile}@inzo.app`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  location.href = "/profile.html";
};

// ================= LOAD PROFILE =================
window.loadProfile = async function () {
  const { data: session } = await supabase.auth.getSession();

  if (!session.session) {
    location.href = "/login.html";
    return;
  }

  const userId = session.session.user.id;

  const { data: bal } = await supabase
    .from("balances")
    .select("ammount")
    .eq("user_id", userId)
    .single();

  qs("bal").innerText = bal?.ammount || 0;
};

// ================= LOGOUT =================
window.logout = async function () {
  await supabase.auth.signOut();
  location.href = "/login.html";
};