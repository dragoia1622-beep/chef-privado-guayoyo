import { categories } from './autor-catalogo.js';

// BLOQUE 01 — Selección de platos entre páginas
const dishesById = new Map(categories.flatMap(({ dishes }) => dishes.map((dish) => [dish.id, dish])));
const storageKey = 'chef-guayoyo-pedido';
const linkedDishes = new URLSearchParams(location.search).get('platos');
let selectedIds = (linkedDishes || '').split(',').map(Number).filter((id) => dishesById.has(id));

export function selectedDishes() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey));
    if (Array.isArray(stored)) selectedIds = stored.filter((id) => dishesById.has(id));
  } catch {
    // La selección sigue disponible en esta página.
  }
  return [...new Set(selectedIds)].map((id) => dishesById.get(id));
}

function saveSelection(ids) {
  selectedIds = ids;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(selectedIds));
  } catch {
    // Los enlaces del pedido llevan los identificadores como respaldo.
  }
}

export function selectDish(id, add) {
  const ids = new Set(selectedDishes().map((dish) => dish.id));
  if (add) ids.add(id);
  else ids.delete(id);
  saveSelection([...ids]);
}

export function clearOrder() {
  saveSelection([]);
}

export function orderLink(path, dishes) {
  const url = new URL(path, location.href);
  if (dishes.length) url.searchParams.set('platos', dishes.map((dish) => dish.id).join(','));
  return url.href;
}

// BLOQUE 02 — Foto marcada y lista del pedido
export function dishPhoto(id) {
  const index = id - 1;
  const sheet = String(Math.floor(index / 6) + 1).padStart(2, '0');
  return {
    src: `./assets/autor/platos-${sheet}.webp?v=marca-1`,
    column: index % 3,
    row: Math.floor(index % 6 / 3),
  };
}

export function setDishPhoto(element, id) {
  const { src, column, row } = dishPhoto(id);
  element.style.setProperty('--photo-col', column);
  element.style.setProperty('--photo-row', row);
  element.querySelector('img').src = src;
}

export function renderOrderList(list, dishes, onRemove, emptyFocus) {
  const items = dishes.map((dish, index) => {
    const item = document.createElement('li');
    const photo = document.createElement('div');
    const image = document.createElement('img');
    const name = document.createElement('span');
    const remove = document.createElement('button');

    photo.className = 'dish-photo order-thumb';
    image.alt = '';
    image.loading = 'lazy';
    photo.append(image);
    setDishPhoto(photo, dish.id);
    name.textContent = dish.name;
    remove.type = 'button';
    remove.className = 'button secondary order-remove';
    remove.textContent = 'Quitar';
    remove.setAttribute('aria-label', `Quitar ${dish.name} del pedido`);
    remove.addEventListener('click', () => {
      onRemove(dish.id);
      const remaining = list.querySelectorAll('button');
      (remaining[Math.min(index, remaining.length - 1)] ?? emptyFocus).focus();
    });
    item.append(photo, name, remove);
    return item;
  });
  list.replaceChildren(...items);
}
