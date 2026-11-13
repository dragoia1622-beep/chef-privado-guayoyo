import { menus, extras, formatEuro, quote } from './carta.js';
import { clearOrder, orderLink, renderOrderList, selectDish, selectedDishes } from './pedido.js';
import { makeOrderPhotos } from './pedido-fotos.js';
import { initBookingCatalog } from './consulta-carta.js';

// BLOQUE 01 — Carta, controles y resumen
const cards = document.querySelector('#menu-cards');
const select = document.querySelector('#menu');
const extrasList = document.querySelector('#extras');
const guests = document.querySelector('#personas');
const minus = document.querySelector('#menos');
const plus = document.querySelector('#mas');
const breakdown = document.querySelector('#breakdown');
const total = document.querySelector('#total');
const perPerson = document.querySelector('#per-person');
const request = document.querySelector('#request');
const orderList = document.querySelector('#order-list');
const orderCount = document.querySelector('#order-count');
const orderEmpty = document.querySelector('#order-empty');
const orderNote = document.querySelector('#order-note');
const chooseDishes = document.querySelector('#choose-dishes');
const min = Number(guests.min);
const max = Number(guests.max);
let lastGuestCount = guests.valueAsNumber;

cards.innerHTML = menus.map((menu) => `
  <article class="menu-card">
    <div class="menu-photo">
      <img src="./assets/${menu.id}.webp?v=marca-1" alt="${menu.imageAlt}" width="760" height="506" loading="lazy" decoding="async">
      <span>${menu.courses} PASES</span>
    </div>
    <div class="menu-body">
      <h3>${menu.name}</h3>
      <p>${menu.description}</p>
      <ol aria-label="Ejemplo de menú de ${menu.courses} pases">${menu.examples.map((dish) => `<li>${dish}</li>`).join('')}</ol>
      <div class="menu-price">
        <strong>${formatEuro(menu.price)} <small>/ persona</small></strong>
        <a class="button secondary" href="#configurador" data-menu="${menu.id}" aria-label="Elegir ${menu.name}">Elegir menú <span class="arrow" aria-hidden="true"></span></a>
      </div>
    </div>
  </article>
`).join('');

select.innerHTML = menus.map((menu) => `
  <option value="${menu.id}">${menu.name} · ${formatEuro(menu.price)} por persona</option>
`).join('');

extrasList.innerHTML = extras.map((extra) => `
  <label class="extra">
    <input type="checkbox" value="${extra.id}">
    <span>${extra.name}${extra.description ? `<small>${extra.description}</small>` : ''}</span>
    <span class="extra-price">+${formatEuro(extra.price)} / ${extra.perGuest ? 'persona' : 'evento'}</span>
  </label>
`).join('');

const aperitivo = extras.find((extra) => extra.id === 'aperitivo');
const aperitivoCard = document.querySelector('#aperitivo');
aperitivoCard.innerHTML = `
  <img src="./assets/aperitivo-bienvenida.webp" alt="Mini cachapa, tequeño con salsa de guayaba y casabe con guasacaca" width="900" height="600" loading="lazy" decoding="async">
  <div class="welcome-bites-copy">
    <h3 id="aperitivo-title">${aperitivo.name}</h3>
    <p>${aperitivo.description} <strong>+${formatEuro(aperitivo.price)} por persona</strong></p>
    <ul>${aperitivo.bites.map((bite) => `<li>${bite}</li>`).join('')}</ul>
    <p class="welcome-allergens">Alérgenos previstos: leche (cachapa y tequeño) y trigo (tequeño). Consulta la composición final si tienes alguna alergia o intolerancia.</p>
    <a class="text-link" href="#configurador">Ver extras del presupuesto <span class="arrow" aria-hidden="true"></span></a>
  </div>
`;
aperitivoCard.hidden = false;

const linkedMenu = new URLSearchParams(window.location.search).get('menu');
if (menus.some((menu) => menu.id === linkedMenu)) select.value = linkedMenu;

function currentQuote() {
  const menu = menus.find((item) => item.id === select.value);
  const checked = new Set(Array.from(extrasList.querySelectorAll(':checked'), (item) => item.value));
  return quote(lastGuestCount, menu, extras.filter((item) => checked.has(item.id)));
}

function updateEstimate() {
  const count = guests.valueAsNumber;
  const valid = Number.isInteger(count) && count >= min && count <= max;
  guests.setAttribute('aria-invalid', String(!valid));
  if (valid) lastGuestCount = count;
  minus.disabled = valid && count === min;
  plus.disabled = valid && count === max;
  request.disabled = !valid;

  if (!valid) {
    breakdown.replaceChildren();
    total.textContent = '—';
    perPerson.textContent = `Indica entre ${min} y ${max} personas.`;
    return;
  }

  const estimate = currentQuote();
  breakdown.innerHTML = estimate.rows.map((row) => `
    <div class="line-item"><dt>${row.label}</dt><dd>${formatEuro(row.amount)}</dd></div>
  `).join('');
  total.textContent = formatEuro(estimate.total);
  perPerson.textContent = `${formatEuro(estimate.total / count)} por persona con esta selección`;
}

function setGuests(count) {
  guests.value = Math.min(max, Math.max(min, Math.round(count)));
  updateEstimate();
}

guests.addEventListener('input', updateEstimate);
guests.addEventListener('change', () => setGuests(Number.isFinite(guests.valueAsNumber) ? guests.valueAsNumber : lastGuestCount));
minus.addEventListener('click', () => setGuests(lastGuestCount - 1));
plus.addEventListener('click', () => setGuests(lastGuestCount + 1));
select.addEventListener('change', updateEstimate);
extrasList.addEventListener('change', updateEstimate);
cards.addEventListener('click', (event) => {
  const link = event.target.closest('[data-menu]');
  if (!link) return;
  select.value = link.dataset.menu;
  updateEstimate();
  select.focus({ preventScroll: true });
});
updateEstimate();

function updateOrder() {
  const dishes = selectedDishes();
  orderCount.textContent = `${dishes.length} ${dishes.length === 1 ? 'plato' : 'platos'}`;
  orderEmpty.hidden = dishes.length > 0;
  orderNote.hidden = dishes.length === 0;
  chooseDishes.href = orderLink('./cocina-de-autor.html#carta-autor', dishes);
  renderOrderList(orderList, dishes, (id) => {
    selectDish(id, false);
    updateOrder();
  }, chooseDishes);
}
window.addEventListener('pageshow', updateOrder);
updateOrder();

// BLOQUE 02 — Navegación en pantallas pequeñas
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#navegacion');

function toggleNav(expanded) {
  navToggle.setAttribute('aria-expanded', String(expanded));
  navToggle.setAttribute('aria-label', expanded ? 'Cerrar navegación' : 'Abrir navegación');
}

navToggle.addEventListener('click', () => toggleNav(navToggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) toggleNav(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
    toggleNav(false);
    navToggle.focus();
  }
});

// BLOQUE 03 — Borrador de consulta y reserva
const dialog = document.querySelector('#booking');
const form = document.querySelector('#booking-form');
const bookingTitle = document.querySelector('#booking-title');
const bookingEstimate = document.querySelector('#booking-estimate');
const draftPanel = document.querySelector('#draft-panel');
const draft = document.querySelector('#draft');
const draftStatus = document.querySelector('#draft-status');
const download = document.querySelector('#download-draft');
const whatsapp = document.querySelector('#whatsapp-draft');
const whatsappContact = 'https://wa.me/34689345235';
const photoOrder = document.querySelector('#photo-order');
const photoStatus = document.querySelector('#photo-order-status');
const photoDownloads = document.querySelector('#photo-downloads');
const shareOrder = document.querySelector('#share-order');
const orderResetStatus = document.querySelector('#order-reset-status');
const previousPhotos = document.querySelector('#previous-order-photos');
const previousPhotoStatus = document.querySelector('#previous-photo-status');
const previousPhotoDownloads = document.querySelector('#previous-photo-downloads');
const madridDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
let estimateForDraft = null;
let dishesForDraft = [];
let draftUrl = '';
let photoRequest = null;
let photoFiles = [];
let photoUrls = [];
let previousPhotoRequest = null;
let previousPhotoUrls = [];
const refreshBookingDishes = initBookingCatalog(() => {
  dishesForDraft = selectedDishes();
  updateOrder();
});

function clearPhotoOrder() {
  photoRequest = null;
  photoFiles = [];
  photoUrls.forEach((url) => URL.revokeObjectURL(url));
  photoUrls = [];
  photoDownloads.replaceChildren();
  shareOrder.hidden = true;
  photoOrder.hidden = true;
}

function clearDraft() {
  draft.value = '';
  draftStatus.textContent = '';
  if (draftUrl) URL.revokeObjectURL(draftUrl);
  draftUrl = '';
  download.removeAttribute('href');
  whatsapp.removeAttribute('href');
  clearPhotoOrder();
}

function openBooking(estimate) {
  estimateForDraft = estimate;
  dishesForDraft = selectedDishes();
  refreshBookingDishes();
  orderResetStatus.textContent = '';
  const today = Object.fromEntries(madridDate.formatToParts(new Date()).map((part) => [part.type, part.value]));
  form.elements.fecha.min = `${today.year}-${today.month}-${today.day}`;
  bookingTitle.textContent = estimate ? 'Prepara tu solicitud' : 'Prepara tu consulta';
  bookingEstimate.textContent = estimate
    ? `${estimate.menu.name} · ${estimate.guests} personas · ${formatEuro(estimate.total)} estimados`
    : 'Consulta general sobre tu evento.';
  form.hidden = false;
  draftPanel.hidden = true;
  dialog.showModal();
  form.elements.nombre.focus();
}

request.addEventListener('click', () => openBooking(currentQuote()));
document.querySelectorAll('[data-contact]').forEach((action) => {
  action.addEventListener('click', (event) => {
    event.preventDefault();
    openBooking(null);
  });
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  form.reset();
  form.elements.nombre.setCustomValidity("");
  form.elements.municipio.setCustomValidity("");
  clearDraft();
});
for (const field of [form.elements.nombre, form.elements.municipio]) {
  field.addEventListener('input', () => field.setCustomValidity(''));
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  for (const field of [form.elements.nombre, form.elements.municipio]) {
    if (!field.value.trim()) {
      field.setCustomValidity('Completa este campo.');
      field.reportValidity();
      return;
    }
  }

  const data = new FormData(form);
  const date = data.get('fecha').split('-').reverse().join('/');
  const email = data.get('correo').trim();
  const details = data.get('detalles').trim();
  const customer = data.get('nombre').trim();
  const dishes = dishesForDraft;
  const lines = [
    'Chef Guayoyo a domicilio',
    estimateForDraft ? 'Solicitud de presupuesto y disponibilidad' : 'Consulta sobre mi evento',
    '',
    `Nombre: ${customer}`,
    ...(email ? [`Correo: ${email}`] : []),
    `Fecha deseada: ${date}`,
    `Municipio: ${data.get('municipio').trim()}`,
  ];
  if (estimateForDraft) {
    lines.push('', `Menú: ${estimateForDraft.menu.name}`, `Comensales: ${estimateForDraft.guests}`);
    estimateForDraft.rows.forEach((row) => lines.push(`• ${row.label}: ${formatEuro(row.amount)}`));
    lines.push(`Total estimado: ${formatEuro(estimateForDraft.total)}`, 'Sujeto a disponibilidad, desplazamiento y presupuesto final.');
  }
  if (details) lines.push('', 'Lo que me gustaría pedir:', details);

  clearDraft();
  const photoSummary = lines.join('\n');
  if (dishes.length) {
    lines.push('', 'Platos elegidos:', ...dishes.map((dish) => `• ${dish.name}`));
  }
  draft.value = lines.join('\n');
  draftUrl = URL.createObjectURL(new Blob([draft.value], { type: 'text/plain;charset=utf-8' }));
  download.href = draftUrl;
  const chat = new URL(whatsappContact);
  chat.searchParams.set('text', draft.value);
  const longMessage = dishes.length > 0 && chat.href.length > 3500;
  if (longMessage) {
    chat.searchParams.set('text', `Hola, soy ${customer}. Quiero consultar un pedido de ${dishes.length} platos. Adjunto las imágenes del pedido con la selección y los datos del evento.`);
  }
  whatsapp.href = chat.href;
  form.hidden = true;
  draftPanel.hidden = false;
  draft.focus();
  if (dishes.length) preparePhotoOrder(dishes, photoSummary, customer, longMessage);
});

document.querySelector('#edit-draft').addEventListener('click', () => {
  clearPhotoOrder();
  draftPanel.hidden = true;
  form.hidden = false;
  form.elements.nombre.focus();
});

function prepareNextOrder() {
  if (!dialog.open || draftPanel.hidden || (!estimateForDraft && !dishesForDraft.length)) return;

  retainPreviousPhotos(photoRequest);
  clearOrder();
  select.value = menus[0].id;
  for (const checkbox of extrasList.querySelectorAll(':checked')) checkbox.checked = false;
  setGuests(Number(guests.defaultValue));
  const url = new URL(location.href);
  url.searchParams.delete('menu');
  url.searchParams.delete('platos');
  history.replaceState(history.state, '', url);
  updateOrder();
  dialog.close();
  request.focus();
  orderResetStatus.textContent = 'El presupuesto está listo para otro encargo.';
}

whatsapp.addEventListener('click', () => {
  const openedDraft = draftUrl;
  // Deja que el enlace se abra antes de cerrar y limpiar el borrador.
  setTimeout(() => {
    if (draftUrl === openedDraft) prepareNextOrder();
  }, 0);
});

// BLOQUE 04 — Fotos para adjuntar o compartir
function addPhotoDownloads(container, files) {
  return files.map((file, index) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(file);
    link.href = url;
    link.download = file.name;
    link.className = 'button secondary';
    link.textContent = files.length === 1 ? 'Descargar imagen del pedido' : `Descargar imagen ${index + 1} de ${files.length}`;
    container.append(link);
    return url;
  });
}

async function retainPreviousPhotos(request) {
  previousPhotoUrls.forEach((url) => URL.revokeObjectURL(url));
  previousPhotoUrls = [];
  previousPhotoDownloads.replaceChildren();
  previousPhotoRequest = request;
  previousPhotos.open = false;
  previousPhotos.hidden = !request;
  if (!request) return;

  previousPhotoStatus.textContent = 'Preparando las imágenes del encargo…';
  try {
    const files = await request;
    if (previousPhotoRequest !== request) return;
    previousPhotoUrls = addPhotoDownloads(previousPhotoDownloads, files);
    previousPhotoStatus.textContent = 'Puedes adjuntar las imágenes en el chat de WhatsApp.';
  } catch {
    if (previousPhotoRequest === request) previousPhotoStatus.textContent = 'No se pudieron preparar las imágenes.';
  }
}

async function preparePhotoOrder(dishes, summary, customer, longMessage) {
  const request = makeOrderPhotos(dishes, summary, customer);
  photoRequest = request;
  photoOrder.hidden = false;
  photoStatus.textContent = 'Preparando las imágenes del pedido…';
  try {
    const files = await request;
    if (photoRequest !== request) return;
    photoFiles = files;
    photoUrls = addPhotoDownloads(photoDownloads, files);
    shareOrder.hidden = !(typeof navigator.share === 'function' && navigator.canShare?.({ files }));
    photoStatus.textContent = longMessage
      ? 'Adjunta todas las imágenes para que el chef reciba el pedido completo.'
      : 'Tu pedido con fotos está listo.';
  } catch {
    if (photoRequest !== request) return;
    photoStatus.textContent = 'Las imágenes no se pudieron preparar. Puedes abrir WhatsApp o copiar el borrador completo.';
  }
}

shareOrder.addEventListener('click', async () => {
  const request = photoRequest;
  try {
    await navigator.share({ files: photoFiles });
    if (photoRequest === request) prepareNextOrder();
  } catch (error) {
    if (photoRequest === request && error.name !== 'AbortError') {
      photoStatus.textContent = 'Puedes descargar las imágenes y adjuntarlas en el chat de WhatsApp.';
    }
  }
});

document.querySelector('#copy-draft').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(draft.value);
    draftStatus.textContent = 'Borrador copiado.';
  } catch {
    draft.focus();
    draft.select();
    draftStatus.textContent = 'Seleccionado. Puedes copiar el texto o descargar el archivo.';
  }
});
