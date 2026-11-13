import { categories } from './autor-catalogo.js';
import { renderOrderList, selectDish, selectedDishes, setDishPhoto } from './pedido.js';

// BLOQUE 01 — Selección de platos dentro de la consulta
export function initBookingCatalog(onChange) {
  const dialog = document.querySelector('#booking-catalog');
  const open = document.querySelector('#open-booking-catalog');
  const close = document.querySelector('#close-booking-catalog');
  const category = document.querySelector('#booking-catalog-category');
  const count = document.querySelector('#booking-catalog-count');
  const items = document.querySelector('#booking-catalog-items');
  const template = document.querySelector('#booking-dish-card');
  const order = document.querySelector('#booking-dish-list');
  const cardButtons = new Map();

  for (const entry of categories) {
    category.add(new Option(entry.name, entry.id));
  }

  function refresh() {
    const dishes = selectedDishes();
    const ids = new Set(dishes.map((dish) => dish.id));
    order.hidden = dishes.length === 0;
    count.textContent = `${dishes.length} ${dishes.length === 1 ? 'plato elegido' : 'platos elegidos'}`;
    for (const [dish, button] of cardButtons) {
      const added = ids.has(dish.id);
      const label = added ? 'Quitar' : 'Agregar';
      button.textContent = label;
      button.setAttribute('aria-label', `${label} ${dish.name}`);
      button.classList.toggle('dish-added', added);
    }

    renderOrderList(order, dishes, (id) => changeSelection(id, false), open);
  }

  function changeSelection(id, add) {
    selectDish(id, add);
    refresh();
    onChange();
  }

  function renderCategory() {
    const entry = categories.find((item) => item.id === category.value);
    cardButtons.clear();
    const cards = entry.dishes.map((dish) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.querySelector('h3').textContent = dish.name;
      setDishPhoto(card.querySelector('.dish-photo'), dish.id);
      const button = card.querySelector('button');
      cardButtons.set(dish, button);
      button.addEventListener('click', () => {
        const alreadyAdded = selectedDishes().some((item) => item.id === dish.id);
        changeSelection(dish.id, !alreadyAdded);
      });
      return card;
    });
    items.replaceChildren(...cards);
    refresh();
  }

  open.addEventListener('click', () => {
    renderCategory();
    dialog.showModal();
    dialog.scrollTop = 0;
    category.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => open.focus());
  category.addEventListener('change', renderCategory);

  return refresh;
}
