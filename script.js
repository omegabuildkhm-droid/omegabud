const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
function closeMenu() {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Відкрити меню');
  menuToggle.textContent = '☰';
}
menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
  menuToggle.textContent = isOpen ? '×' : '☰';
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    closeMenu();
    menuToggle.focus();
  }
});
document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('lead-form');
const result = document.getElementById('form-result');
const actions = document.getElementById('request-actions');
const phoneInput = document.getElementById('phone');
const copyStatus = document.getElementById('copy-status');
let requestText = '';

form.addEventListener('input', () => {
  phoneInput.setCustomValidity('');
  result.classList.remove('show');
  result.textContent = '';
  actions.hidden = true;
  copyStatus.textContent = '';
  requestText = '';
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const digits = phone.replace(/\D/g, '');
  const ukrainian = /^0\d{9}$/.test(digits) || /^380\d{9}$/.test(digits);
  const international = /^\+[\d\s()-]+$/.test(phone) && /^[1-9]\d{7,14}$/.test(digits);
  if (!ukrainian && !international) {
    phoneInput.setCustomValidity('Вкажіть коректний номер, наприклад +380 97 123 45 67.');
    phoneInput.reportValidity();
    return;
  }
  if (!name) {
    document.getElementById('name').focus();
    return;
  }
  requestText = [
    'Заявка з сайту Омегабуд',
    `Ім’я: ${name}`,
    `Телефон: ${phone}`,
    `Послуга: ${String(data.get('service') || '').trim()}`,
    String(data.get('details') || '').trim() ? `Деталі: ${String(data.get('details')).trim()}` : ''
  ].filter(Boolean).join('\n');
  result.textContent = requestText + '\n\nЗаявку підготовлено. Оберіть спосіб надсилання нижче.';
  result.classList.add('show');
  document.getElementById('email-link').href = `mailto:omegabuild.khm@gmail.com?subject=${encodeURIComponent('Заявка на ремонт — Омегабуд')}&body=${encodeURIComponent(requestText)}`;
  document.getElementById('sms-link').href = `sms:+380979623063?body=${encodeURIComponent(requestText)}`;
  actions.hidden = false;
  result.focus();
});
document.getElementById('copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(requestText);
    copyStatus.textContent = 'Текст скопійовано. Вставте його в повідомлення та надішліть нам.';
  } catch {
    copyStatus.textContent = 'Не вдалося скопіювати автоматично. Виділіть і скопіюйте текст заявки вище.';
  }
});

// Carry the chosen service into the consultation request.
document.querySelectorAll('[data-service]').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('service').value = link.dataset.service;
    form.dispatchEvent(new Event('input', { bubbles: true }));
  });
});
