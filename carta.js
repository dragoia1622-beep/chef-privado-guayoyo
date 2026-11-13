// BLOQUE 01 — Carta y tarifas orientativas
export const menus = [
  {
    id: 'mediterraneo',
    name: 'Raíces Mediterráneas',
    price: 65,
    minimum: 260,
    courses: 3,
    imageAlt: 'Lubina dorada sobre pimientos asados',
    description: 'Una mesa de temporada, sencilla y cuidada.',
    examples: [
      'Burrata con tomate asado',
      'Lubina con pimientos y pilpil',
      'Crema catalana',
    ],
  },
  {
    id: 'cocina-en-vivo',
    name: 'Cocina en Vivo',
    price: 95,
    minimum: 570,
    courses: 5,
    imageAlt: 'Pabellón criollo con arroz, caraotas, carne mechada y plátano',
    description: 'Cinco pases con sabores de mi cocina venezolana.',
    examples: [
      'Arepitas con queso fresco',
      'Croqueta de yuca con queso ahumado y guayaba',
      'Crema de maíz tostado con cangrejo y ají dulce',
      'Pabellón criollo',
      'Tres leches de vainilla',
    ],
  },
  {
    id: 'autor',
    name: 'Autor Premium',
    price: 145,
    minimum: 870,
    courses: 7,
    imageAlt: 'Costilla de ternera glaseada con puré y chalota asada',
    description: 'Un menú degustación para celebrar sin prisas.',
    examples: [
      'Arepita de maíz morado con cangrejo y ají dulce',
      'Carpaccio de remolacha con queso de cabra y cacao',
      'Vieira con crema de maíz',
      'Róbalo en costra de maíz morado',
      'Costilla de ternera al vino tinto',
      'Coco, limón y hierbabuena',
      'Chocolate y guayoyo',
    ],
  },
];

export const extras = [
  {
    id: 'aperitivo',
    name: 'Aperitivo de bienvenida',
    description: 'Tres bocados por persona antes del primer pase.',
    bites: [
      'Mini cachapa con queso de mano',
      'Tequeño con salsa de guayaba',
      'Casabe crujiente con guasacaca',
    ],
    price: 12,
    perGuest: true,
  },
  {
    id: 'bebidas',
    name: 'Bebidas sin alcohol',
    description: 'Agua mineral y una bebida por persona a elegir entre papelón con limón y zumo de maracuyá.',
    price: 9,
    perGuest: true,
  },
  { id: 'tarta', name: 'Tarta de celebración', price: 45, perGuest: false },
];

export const formatEuro = (value) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  maximumFractionDigits: 2,
}).format(value);

export function quote(guests, menu, selectedExtras) {
  const base = guests * menu.price;
  const supplement = Math.max(0, menu.minimum - base);
  const extraRows = selectedExtras.map((extra) => ({
    label: extra.name,
    amount: extra.price * (extra.perGuest ? guests : 1),
  }));
  const rows = [{ label: `${guests} × ${formatEuro(menu.price)} · ${menu.name}`, amount: base }];
  if (supplement) rows.push({ label: 'Ajuste al mínimo de servicio', amount: supplement });
  rows.push(...extraRows);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return { guests, menu, rows, total };
}
