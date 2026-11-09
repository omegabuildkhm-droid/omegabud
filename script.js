const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.textContent = isOpen ? '×' : '☰';
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  }));
}

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('lead-form');
const result = document.getElementById('form-result');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const service = String(data.get('service') || '').trim();
  const details = String(data.get('details') || '').trim();

  const message = [
    'Заявка з сайту Омегабуд',
    `Ім’я: ${name}`,
    `Телефон: ${phone}`,
    `Послуга: ${service}`,
    details ? `Деталі: ${details}` : ''
  ].filter(Boolean).join('\n');

  result.textContent = message + '\n\nНатисніть кнопку нижче, щоб відкрити SMS із цією заявкою.';
  result.classList.add('show');

  let smsLink = document.getElementById('sms-link');
  if (!smsLink) {
    smsLink = document.createElement('a');
    smsLink.id = 'sms-link';
    smsLink.className = 'btn btn-primary';
    smsLink.style.marginTop = '10px';
    smsLink.textContent = 'Відкрити SMS';
    result.after(smsLink);
  }
  smsLink.href = `sms:+380979623063?body=${encodeURIComponent(message)}`;
  smsLink.setAttribute('aria-label', 'Відкрити SMS із заявкою для Омегабуд');
});
