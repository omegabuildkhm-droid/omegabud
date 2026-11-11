
const SUPABASE_URL = "https://ioyxmqhbpzcibzjdjtoz.supabase.co";
const SUPABASE_KEY = "sb_publishable_-EY9FRTqKSFUej8-pndpFQ_4_o054Zn";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginScreen = document.getElementById("loginScreen");
const adminApp = document.getElementById("adminApp");
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

let editor = null;
let currentPageId = null;
let pages = [];

function showMessage(text, success = false) {
  message.textContent = text;
  message.style.color = success ? "#16803c" : "#b42318";
}

async function checkOwner() {
  const { data: isOwner, error } = await db.rpc("is_site_owner");
  if (error || isOwner !== true) {
    await db.auth.signOut();
    throw new Error("Доступ дозволено лише власнику Омегабуд.");
  }
}

async function openAdmin() {
  await checkOwner();

  loginScreen.style.display = "none";
  adminApp.style.display = "block";

  adminApp.innerHTML = `
    <header class="admin-header">
      <div class="admin-brand">ОМЕГАБУД <span>КЕРУВАННЯ САЙТОМ</span></div>
      <button id="logoutButton" class="logout-button">Вийти</button>
    </header>

    <div class="admin-layout">
      <aside class="admin-sidebar">
        <h3>Керування</h3>
        <button class="nav-button" id="pagesTab">Архів редактора</button>
        <button class="nav-button" id="editorTab" hidden>Редактор чернеток</button>
        <button class="nav-button" id="seoTab" hidden>SEO</button>
        <button class="nav-button" id="mediaTab" hidden>Медіатека</button>
        <div class="sidebar-note">Сайт Омегабуд</div>
      </aside>

      <section class="admin-content">
        <div id="pagesView">
          <div class="view-heading">
            <div>
              <h1>Сторінки сайту</h1>
              <p>Створюйте та редагуйте сторінки компанії.</p>
            </div>
            <button id="newPageButton" class="primary-button">+ Нова сторінка</button>
          </div>
          <div id="pagesList">Завантаження сторінок...</div>
        </div>

        <div id="editorView" style="display:none">
          <div class="view-heading editor-heading">
            <div>
              <h1 id="editorTitle">Візуальний редактор</h1>
              <p>Архівний редактор: зберігає в базі Supabase. Ці чернетки не замінюють сторінки основного сайту.</p>
            </div>
            <div class="editor-actions">
              <button id="saveDraftButton" class="secondary-button">Зберегти чернетку</button>
              <button id="publishButton" class="primary-button">Зберегти в базі</button>
            </div>
          </div>
          <div class="editor-fields">
            <label>Назва сторінки
              <input id="pageTitle" placeholder="Наприклад: Головна">
            </label>
            <label>Адреса сторінки
              <input id="pageSlug" placeholder="Наприклад: home">
            </label>
          </div>
          <div id="gjs"></div>
        </div>

        <div id="seoView" style="display:none">
          <h1>SEO</h1>
          <p>SEO-поля налаштовуються для кожної сторінки в редакторі.</p>
          <p>Відкрийте сторінку та заповніть її SEO-налаштування.</p>
        </div>

        <div id="mediaView" style="display:none">
          <h1>Медіатека</h1>
          <p>Завантаження фотографій і відео підключимо наступним етапом.</p>
        </div>
      </section>
    </div>
  `;

  document.getElementById("logoutButton").onclick = async () => {
    await db.auth.signOut();
    location.reload();
  };

  document.getElementById("pagesTab").onclick = () => showView("pages");
  document.getElementById("editorTab").onclick = () => showView("editor");
  document.getElementById("seoTab").onclick = () => showView("seo");
  document.getElementById("mediaTab").onclick = () => showView("media");

  document.getElementById("newPageButton").onclick = createPage;
  document.getElementById("saveDraftButton").onclick = () => savePage("draft");
  document.getElementById("publishButton").onclick = () => savePage("published");

  await initWorkspace();
  await loadPages();
}

function showView(view) {
  ["pages", "editor", "seo", "media", "portfolio", "leads", "analytics", "settings"].forEach(name => {
    document.getElementById(name + "View").style.display =
      name === view ? "block" : "none";

    const tab = document.getElementById(name + "Tab");
    if (tab) tab.classList.toggle("active", name === view);
  });

  if (view === "editor") {
    setTimeout(() => {
      if (editor) editor.refresh();
    }, 100);
  }
}

async function loadPages() {
  const container = document.getElementById("pagesList");
  container.textContent = "Завантаження...";

  const { data, error } = await db
    .from("site_pages")
    .select("id,title,slug,status,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    container.textContent = "Помилка завантаження: " + error.message;
    return;
  }

  pages = data || [];

  if (!pages.length) {
    container.innerHTML = "<p>Сторінок поки немає. Створіть першу сторінку.</p>";
    return;
  }

  container.innerHTML = pages.map(page => `
    <div class="page-row">
      <div>
        <strong>${escapeHTML(page.title)}</strong>
        <div class="page-meta">/${escapeHTML(page.slug)} · ${page.status === "published" ? "Опублікована" : "Чернетка"}</div>
      </div>
      <button class="secondary-button" data-edit="${page.id}">Редагувати</button>
    </div>
  `).join("");

  container.querySelectorAll("[data-edit]").forEach(button => {
    button.onclick = () => editPage(button.dataset.edit);
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function createPage() {
  const title = prompt("Назва нової сторінки:");
  if (!title || !title.trim()) return;

  const slug = title.trim()
    .toLowerCase()
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await db
    .from("site_pages")
    .insert({
      title: title.trim(),
      slug: slug || "new-page",
      status: "draft",
      editor_data: {},
      content_html: "",
      content_css: ""
    })
    .select()
    .single();

  if (error) {
    alert("Не вдалося створити сторінку: " + error.message);
    return;
  }

  await loadPages();
  await editPage(data.id);
}

async function initEditor(projectData = {}) {
  if (editor) {
    editor.destroy();
    editor = null;
  }

  editor = grapesjs.init({
    container: "#gjs",
    height: "650px",
    width: "100%",
    storageManager: false,
    panels: { defaults: [] },
    projectData: projectData && projectData.pages ? projectData : undefined,
    blockManager: {
      appendTo: "#gjs",
      blocks: [
        {
          id: "section",
          label: "Секція",
          content: "<section style='padding:40px'><h2>Заголовок секції</h2><p>Текст секції</p></section>"
        },
        {
          id: "heading",
          label: "Заголовок",
          content: "<h1>Новий заголовок</h1>"
        },
        {
          id: "text",
          label: "Текст",
          content: "<p>Введіть текст тут</p>"
        },
        {
          id: "image",
          label: "Зображення",
          content: "<img src='https://placehold.co/800x400' alt='Зображення' style='width:100%'>"
        },
        {
          id: "button",
          label: "Кнопка",
          content: "<a href='#' style='display:inline-block;padding:14px 25px;background:#202735;color:white;text-decoration:none;border-radius:6px'>Детальніше</a>"
        },
        {
          id: "columns",
          label: "Дві колонки",
          content: "<div style='display:flex;gap:20px;flex-wrap:wrap'><div style='flex:1;min-width:200px;padding:20px'>Перша колонка</div><div style='flex:1;min-width:200px;padding:20px'>Друга колонка</div></div>"
        }
      ]
    }
  });
}

async function editPage(id) {
  const { data: page, error } = await db
    .from("site_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Не вдалося відкрити сторінку: " + error.message);
    return;
  }

  currentPageId = page.id;
  document.getElementById("pageTitle").value = page.title;
  document.getElementById("pageSlug").value = page.slug;
  document.getElementById("editorTitle").textContent = "Редактор: " + page.title;

  await initEditor(page.editor_data || {});

  if (!page.editor_data || !page.editor_data.pages) {
    editor.setComponents(page.content_html || "");
    editor.setStyle(page.content_css || "");
  }

  showView("editor");
}

async function savePage(status) {
  if (!currentPageId || !editor) {
    alert("Спочатку створіть або відкрийте сторінку.");
    return;
  }

  const title = document.getElementById("pageTitle").value.trim();
  const slug = document.getElementById("pageSlug").value.trim();

  if (!title || !slug) {
    alert("Заповніть назву та адресу сторінки.");
    return;
  }

  const updates = {
    title,
    slug,
    status,
    editor_data: editor.getProjectData(),
    content_html: editor.getHtml(),
    content_css: editor.getCss(),
    updated_at: new Date().toISOString()
  };

  if (status === "published") {
    updates.published_at = new Date().toISOString();
  }

  const { error } = await db
    .from("site_pages")
    .update(updates)
    .eq("id", currentPageId);

  if (error) {
    alert("Помилка збереження: " + error.message);
    return;
  }

  alert(status === "published" ? "Сторінку збережено в базі. Основний сайт не змінено." : "Чернетку збережено.");
  await loadPages();
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  loginButton.disabled = true;
  loginButton.textContent = "Перевірка...";
  showMessage("");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await openAdmin();
  } catch (error) {
    showMessage(error.message || "Не вдалося увійти.");
    loginButton.disabled = false;
    loginButton.textContent = "Увійти";
  }
});

async function start() {
  const { data: { session } } = await db.auth.getSession();

  if (session) {
    try {
      await openAdmin();
    } catch (error) {
      showMessage(error.message);
      loginScreen.style.display = "flex";
    }
  }
}

start();
