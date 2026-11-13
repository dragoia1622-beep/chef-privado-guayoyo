import { categories } from './autor-catalogo.js';
import { orderLink, renderOrderList, selectDish, selectedDishes, setDishPhoto } from './pedido.js';

// BLOQUE 01 — Categorías y platos
const catalog = document.querySelector('#catalog-groups');
const groupTemplate = document.querySelector('#category-template');
const dishTemplate = document.querySelector('#dish-template');
const search = document.querySelector('#buscar-platos');
const count = document.querySelector('#catalog-count');
const empty = document.querySelector('#catalog-empty');
const dialog = document.querySelector('#dish-dialog');
const dialogPhoto = dialog.querySelector('.dish-photo');
const dialogCategory = dialog.querySelector('#dish-dialog-category');
const dialogTitle = dialog.querySelector('#dish-dialog-title');
const dialogDescription = dialog.querySelector('#dish-dialog-description');
const dialogClose = dialog.querySelector('.close');
const dialogSelect = document.querySelector('#dialog-dish-select');
const order = document.querySelector('#mi-pedido');
const orderList = document.querySelector('#catalog-order-list');
const orderCount = document.querySelector('#catalog-order-count');
const orderEmpty = document.querySelector('#catalog-order-empty');
const review = document.querySelector('#review-order');
const configure = document.querySelector('#catalog-configure');
const orderShortcut = document.querySelector('#order-shortcut');
const shortcutCount = document.querySelector('#order-shortcut-count');
const toggles = new Map();
let activeCard = null;
let activeDish = null;

function normalize(value) {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

const rendered = categories.map((category, index) => {
  const group = groupTemplate.content.firstElementChild.cloneNode(true);
  group.id = category.id;
  group.open = index === 0;
  group.querySelector('h2').textContent = category.name;
  const groupCount = group.querySelector('.category-count');
  const list = group.querySelector('ul');
  const dishes = category.dishes.map((dish) => {
    const item = dishTemplate.content.firstElementChild.cloneNode(true);
    const button = item.querySelector('.dish-open');
    const toggle = item.querySelector('.dish-select');
    button.textContent = dish.name;
    button.addEventListener('click', () => openDish(dish, category.name, button));
    toggle.addEventListener('click', () => toggleDish(dish.id));
    toggles.set(dish.id, { button: toggle, dish });
    item.querySelector('p').textContent = dish.description;
    setDishPhoto(item.querySelector('.dish-photo'), dish.id);
    list.append(item);
    return { item, searchText: normalize(`${dish.name} ${dish.description}`) };
  });
  catalog.append(group);
  return { group, groupCount, dishes, wasOpen: group.open };
});

// BLOQUE 02 — Búsqueda por plato o ingrediente de la descripción
let searching = false;

function updateCatalog() {
  const query = normalize(search.value).trim();
  const terms = query ? query.split(/\s+/) : [];
  let matches = 0;
  let visibleGroups = 0;

  for (const category of rendered) {
    const { group, groupCount, dishes } = category;
    if (query && !searching) category.wasOpen = group.open;
    let visible = 0;

    for (const { item, searchText } of dishes) {
      item.hidden = !terms.every((term) => searchText.includes(term));
      if (!item.hidden) visible++;
    }

    group.hidden = visible === 0;
    groupCount.textContent = `${visible} ${visible === 1 ? 'propuesta' : 'propuestas'}`;
    if (query) group.open = visible > 0;
    else if (searching) group.open = category.wasOpen;
    if (visible) visibleGroups++;
    matches += visible;
  }

  searching = Boolean(query);
  count.textContent = `${matches} ${matches === 1 ? 'propuesta' : 'propuestas'} · ${visibleGroups} ${visibleGroups === 1 ? 'categoría' : 'categorías'}`;
  empty.hidden = matches > 0;
}

search.addEventListener('input', updateCatalog);
updateCatalog();
document.querySelector('.catalog-toolbar').hidden = false;

// BLOQUE 03 — Mi pedido
function toggleDish(id) {
  selectDish(id, !selectedDishes().some((dish) => dish.id === id));
  updateOrder();
}

function updateToggle(button, dish, selected) {
  button.textContent = selected ? 'Quitar del pedido' : 'Agregar al pedido';
  button.setAttribute('aria-label', selected
    ? `Quitar ${dish.name} del pedido`
    : `Agregar al pedido: ${dish.name}`);
  button.classList.toggle('dish-selected', selected);
}

function updateOrder() {
  const dishes = selectedDishes();
  const ids = new Set(dishes.map((dish) => dish.id));
  orderCount.textContent = `${dishes.length} ${dishes.length === 1 ? 'plato' : 'platos'}`;
  shortcutCount.textContent = `(${dishes.length})`;
  orderShortcut.hidden = dishes.length === 0;
  orderEmpty.hidden = dishes.length > 0;
  review.href = orderLink('./?menu=autor#mi-pedido', dishes);
  configure.href = orderLink('./?menu=autor#configurador', dishes);
  for (const { button, dish } of toggles.values()) updateToggle(button, dish, ids.has(dish.id));
  if (activeDish) updateToggle(dialogSelect, activeDish, ids.has(activeDish.id));
  renderOrderList(orderList, dishes, (id) => {
    selectDish(id, false);
    updateOrder();
  }, review);
}
dialogSelect.addEventListener('click', () => toggleDish(activeDish.id));
window.addEventListener('pageshow', updateOrder);
updateOrder();
order.hidden = false;

// BLOQUE 04 — Vista ampliada del plato
function openDish(dish, category, button) {
  activeCard = button;
  activeDish = dish;
  updateToggle(dialogSelect, dish, selectedDishes().some((item) => item.id === dish.id));
  setDishPhoto(dialogPhoto, dish.id);
  dialogPhoto.querySelector('img').alt = `Presentación ilustrativa de ${dish.name}`;
  dialogCategory.textContent = category;
  dialogTitle.textContent = dish.name;
  dialogDescription.textContent = dish.description;
  dialog.scrollTop = 0;
  dialog.showModal();
}

dialogClose.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  activeCard?.focus({ preventScroll: true });
  activeCard = null;
  activeDish = null;
});
