const dialog = document.createElement('dialog');
dialog.className = 'photo-viewer';
dialog.setAttribute('aria-label', 'Перегляд фотографій');
dialog.innerHTML = `
  <div class="photo-viewer-toolbar">
    <span class="photo-viewer-count" aria-live="polite"></span>
    <button type="button" data-close aria-label="Закрити перегляд" autofocus>×</button>
  </div>
  <div class="photo-viewer-stage">
    <img alt="">
    <button type="button" data-prev aria-label="Попереднє фото">‹</button>
    <button type="button" data-next aria-label="Наступне фото">›</button>
  </div>
  <p class="photo-viewer-caption"></p>`;
document.body.append(dialog);

const image = dialog.querySelector('img');
const count = dialog.querySelector('.photo-viewer-count');
const caption = dialog.querySelector('.photo-viewer-caption');
const previous = dialog.querySelector('[data-prev]');
const next = dialog.querySelector('[data-next]');
const stage = dialog.querySelector('.photo-viewer-stage');
let photos = [];
let index = 0;
let opener;
let touchStart;

function showPhoto(position) {
  index = (position + photos.length) % photos.length;
  const photo = photos[index];
  image.src = photo.src;
  image.alt = photo.description;
  caption.textContent = photo.description;
  count.textContent = `${index + 1} / ${photos.length}`;
  previous.hidden = next.hidden = photos.length < 2;
}

function move(offset) {
  if (photos.length > 1) showPhoto(index + offset);
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[data-photo-index]');
  if (!link || event.defaultPrevented || event.button !== 0 ||
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const group = link.closest('[data-photo-group]');
  if (!group || typeof dialog.showModal !== 'function') return;

  const links = [...group.querySelectorAll('a[data-photo-index]')];
  const unique = new Map(links.map(item => [Number(item.dataset.photoIndex), item]));
  photos = [...unique.values()].map(item => ({
    src: item.href,
    description: item.querySelector('img').alt
  }));
  const position = [...unique.keys()].indexOf(Number(link.dataset.photoIndex));
  if (position < 0) return;

  event.preventDefault();
  opener = link;
  showPhoto(position);
  dialog.showModal();
  document.documentElement.classList.add('photo-viewer-open');
});

previous.onclick = () => move(-1);
next.onclick = () => move(1);
dialog.querySelector('[data-close]').onclick = () => dialog.close();
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  document.documentElement.classList.remove('photo-viewer-open');
  touchStart = undefined;
  opener?.focus({preventScroll: true});
});
dialog.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  move(event.key === 'ArrowLeft' ? -1 : 1);
});

stage.addEventListener('touchstart', event => {
  touchStart = event.touches.length === 1 && !event.target.closest('button')
    ? {x: event.touches[0].clientX, y: event.touches[0].clientY}
    : undefined;
}, {passive: true});
stage.addEventListener('touchend', event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = undefined;
  if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
});
stage.addEventListener('touchcancel', () => { touchStart = undefined; });
