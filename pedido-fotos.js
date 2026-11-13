import { dishPhoto } from './pedido.js';

// BLOQUE 01 — Composición local del pedido con fotos
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo cargar la foto de un plato.'));
    image.src = src;
  });
}

function wrapText(context, text, width) {
  return text.split('\n').flatMap((paragraph) => {
    let line = '';
    const lines = [];
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const character of word) {
        if (context.measureText(line + character).width > width) {
          lines.push(line);
          line = '';
        }
        line += character;
      }
    }
    return [...lines, line];
  });
}

function toJpeg(canvas, name) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('No se pudo generar la imagen del pedido.'));
      resolve(new File([blob], name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.91);
  });
}

export async function makeOrderPhotos(dishes, summary, customer) {
  const perPage = 8;
  const pageCount = Math.ceil(dishes.length / perPage);
  const photos = dishes.map((dish) => dishPhoto(dish.id));
  const sources = [...new Set(photos.map((photo) => photo.src))];
  const images = new Map(await Promise.all(sources.map(async (src) => [src, await loadImage(src)])));
  const files = [];

  for (let page = 0; page < pageCount; page++) {
    const start = page * perPage;
    const pageDishes = dishes.slice(start, start + perPage);
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no permite generar imágenes.');
    context.font = '21px sans-serif';
    const headerText = page === 0 ? summary : `Pedido de ${customer}`;
    const lines = wrapText(context, headerText, 920);
    const gridTop = 112 + lines.length * 28;
    canvas.height = gridTop + Math.ceil(pageDishes.length / 2) * 160 + 42;

    context.fillStyle = '#180f12';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#eeb976';
    context.font = 'bold 38px sans-serif';
    context.fillText('Chef Guayoyo · Mi pedido', 40, 60);
    context.font = '21px sans-serif';
    context.fillStyle = '#fff3e4';
    lines.forEach((line, index) => context.fillText(line, 40, 98 + index * 28));

    pageDishes.forEach((dish, index) => {
      const { src, column, row } = photos[start + index];
      const image = images.get(src);
      const width = image.naturalWidth / 3;
      const height = image.naturalHeight / 2;
      const x = 40 + (index % 2) * 470;
      const y = gridTop + Math.floor(index / 2) * 160;
      context.fillStyle = '#2b1a1d';
      context.fillRect(x, y, 450, 150);
      context.drawImage(image, column * width, row * height, width, height, x + 6, y + 6, 138, 138);
      context.font = 'bold 20px sans-serif';
      context.fillStyle = '#fff3e4';
      wrapText(context, dish.name, 282).forEach((line, i) => context.fillText(line, x + 154, y + 31 + i * 23));
    });

    context.font = '18px sans-serif';
    context.fillStyle = '#eeb976';
    context.fillText(`Fotos de los platos · ${page + 1} de ${pageCount}`, 40, canvas.height - 23);
    const suffix = pageCount === 1 ? '' : `-${page + 1}-de-${pageCount}`;
    files.push(await toJpeg(canvas, `pedido-chef-guayoyo${suffix}.jpg`));
  }
  return files;
}
