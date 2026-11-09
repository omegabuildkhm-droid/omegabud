
const SUPABASE_URL = "https://ioyxmqhbpzcibzjdjtoz.supabase.co";
const SUPABASE_KEY = "sb_publishable_-EY9FRTqKSFUej8-pndpFQ_4_o054Zn";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

function showMessage(text, success = false) {
  message.textContent = text;
  message.style.color = success ? "#16803c" : "#b42318";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginButton.disabled = true;
  loginButton.textContent = "Перевірка...";
  showMessage("");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const { data: isOwner, error: ownerError } =
      await supabaseClient.rpc("is_site_owner");

    if (ownerError) throw ownerError;

    if (isOwner !== true) {
      await supabaseClient.auth.signOut();
      throw new Error("Доступ дозволено лише власнику Омегабуд.");
    }

    showMessage("Авторизація успішна. Адмін-панель готується.", true);
    loginButton.textContent = "Вхід виконано";

    // Наступним етапом підключимо робочу панель керування.
  } catch (error) {
    showMessage(error.message || "Не вдалося увійти.");
    loginButton.disabled = false;
    loginButton.textContent = "Увійти";
  }
});
