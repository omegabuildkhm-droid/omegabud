let managedWorks = [];

function applyWorkCatalog(works) {
  managedWorks = works;
  for (const work of works) {
    workspaceCatalog.workTypeLabels[work.id] = work.short;
    serviceLabels[work.id] = work.name;
  }
}

function initWorkCatalog() {
  document.querySelector('.admin-sidebar').insertAdjacentHTML('beforeend',
    '<button class="nav-button" id="workCatalogTab">Види робіт</button>');
  document.querySelector('.admin-content').insertAdjacentHTML('beforeend', `
    <section id="workCatalogView" style="display:none">
      <div class="view-heading"><div><h1>Види робіт</h1>
        <p>Опубліковані послуги доступні в каталозі та заявці на кошторис. Приховані можна опублікувати знову.</p>
      </div><button id="add-work" class="primary-button" type="button">Додати вид робіт</button></div>
      <form id="work-editor" class="workspace-panel" hidden>
        <h2 id="work-editor-title">Новий вид робіт</h2>
        <label>Назва<input name="name" required maxlength="100"></label>
        <label>Опис послуги<textarea name="lead" required maxlength="1200" rows="4"></textarea></label>
        <label>Що входить у послугу<textarea name="includes" maxlength="2400" rows="4" placeholder="Кожен пункт з нового рядка, до 12 пунктів"></textarea></label>
        <label>Як визначається вартість<textarea name="price" maxlength="600" rows="2"></textarea></label>
        <label class="workspace-checkbox"><input type="checkbox" name="published"> Опублікувати на сайті</label>
        <div class="workspace-actions">
          <button type="submit" class="primary-button">Зберегти</button>
          <button type="button" class="secondary-button" id="cancel-work">Скасувати</button>
        </div>
      </form>
      <div id="work-catalog-list"></div>
    </section>`);
  const form = document.querySelector('#work-editor');
  document.querySelector('#workCatalogTab').onclick = async () => {
    showView('workCatalog');
    workspaceNotice('');
    try {
      const {works} = await workspaceRequest('work-catalog');
      applyWorkCatalog(works);
      renderWorkCatalog();
    } catch (error) { workspaceNotice(error.message,true); }
  };
  document.querySelector('#add-work').onclick = () => openWorkEditor();
  document.querySelector('#cancel-work').onclick = () => { form.hidden = true; };
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('[type=submit]');
    const data = Object.fromEntries(new FormData(form));
    await updateWork(button,{
      ...data,id:form.dataset.workId,create:form.dataset.create==='yes',
      published:form.elements.published.checked
    },() => { form.hidden = true; });
  };
}

function openWorkEditor(work) {
  const form = document.querySelector('#work-editor');
  form.reset();
  form.dataset.workId = work?.id || 'work-' + crypto.randomUUID();
  form.dataset.create = work ? 'no' : 'yes';
  document.querySelector('#work-editor-title').textContent = work ? 'Редагувати послугу' : 'Новий вид робіт';
  if (work) {
    for (const key of ['name','lead','price']) form.elements[key].value = work[key];
    form.elements.includes.value = work.includes.join('\n');
    form.elements.published.checked = work.published;
  }
  form.hidden = false;
  form.elements.name.focus();
}

async function updateWork(button,data,onSuccess) {
  button.disabled = true;
  workspaceNotice('');
  try {
    const {works} = await workspaceRequest('work-catalog',{method:'POST',data});
    applyWorkCatalog(works);
    renderWorkCatalog();
    onSuccess?.();
    workspaceNotice(data.published?'Послугу опубліковано.':'Збережено. Послугу приховано з сайту.');
  } catch (error) {
    workspaceNotice(error.message,true);
  } finally {
    button.disabled = false;
  }
}

function renderWorkCatalog() {
  const list = document.querySelector('#work-catalog-list');
  list.replaceChildren();
  for (const work of managedWorks) {
    const row = document.createElement('article');
    row.className = 'workspace-panel work-catalog-row';
    const heading = document.createElement('h2');
    heading.textContent = work.name;
    const state = document.createElement('p');
    state.className = 'workspace-help';
    state.textContent = work.published ? 'Опубліковано' : 'Приховано';
    const actions = document.createElement('div');
    actions.className = 'workspace-actions';
    const button = document.createElement('button');
    button.className = 'secondary-button';
    button.textContent = work.published ? 'Приховати' : 'Опублікувати';
    button.onclick = () => updateWork(button,{
      id:work.id,published:!work.published,statusOnly:true
    },() => {
      const form = document.querySelector('#work-editor');
      if (form.dataset.workId === work.id) form.elements.published.checked = !work.published;
    });
    actions.append(button);
    if (work.id.startsWith('work-')) {
      const edit = document.createElement('button');
      edit.className = 'secondary-button';
      edit.textContent = 'Редагувати';
      edit.onclick = () => openWorkEditor(work);
      actions.append(edit);
    }
    if (work.published) {
      const link = document.createElement('a');
      link.href = '/posluhy/' + work.id + '/';
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Відкрити сторінку';
      actions.append(link);
    }
    row.append(heading,state,actions);
    list.append(row);
  }
}
