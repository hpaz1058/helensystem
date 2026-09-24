export const productImages = {
  basicTee: '/images/products/basic-tee.webp',
  ribbedKnitTop: '/images/products/ribbed-knit-top.jpg',
  blouse: '/images/products/blouse.avif',
  midDress: '/images/products/mid-dress.webp',
  wideLegPants: '/images/products/wide-leg-pants.avif',
  sweater: '/images/products/sweater.avif',
  cardigan: '/images/products/cardigan.webp',
  shoulderBag: '/images/products/shoulder-bag.webp'
};

const imageByName = {
  'basic tee': productImages.basicTee,
  'ribbed knit top': productImages.ribbedKnitTop,
  blouse: productImages.blouse,
  'mid dress': productImages.midDress,
  'wide leg pants': productImages.wideLegPants,
  sweater: productImages.sweater,
  cardigan: productImages.cardigan,
  'shoulder bag': productImages.shoulderBag
};

export const getProductImage = (product) => {
  const key = String(product?.name || '').trim().toLowerCase();
  return imageByName[key] || product?.image || '/images/products/basic-tee.webp';
};

export const normalizeProduct = (product) => ({
  ...product,
  image: getProductImage(product)
});

export const normalizeProducts = (products) =>
  (Array.isArray(products) ? products : []).map(normalizeProduct);

export const categories = [
  { name: 'Tops', image: productImages.ribbedKnitTop, icon: 'bi-person' },
  { name: 'Dresses', image: productImages.midDress, icon: 'bi-stars' },
  { name: 'Bottoms', image: productImages.wideLegPants, icon: 'bi-layout-text-window' },
  { name: 'Accessories', image: productImages.shoulderBag, icon: 'bi-bag' }
];

export const fallbackProducts = [
  { id: 'p1', name: 'Basic Tee', price: 399, category: 'Tops', image: productImages.basicTee, description: 'A clean everyday tee with a relaxed modern fit.' },
  { id: 'p2', name: 'Ribbed Knit Top', price: 499, category: 'Tops', image: productImages.ribbedKnitTop, description: 'Soft ribbed texture designed for easy layering.' },
  { id: 'p3', name: 'Blouse', price: 599, category: 'Tops', image: productImages.blouse, description: 'An airy blouse that works from desk to dinner.' },
  { id: 'p4', name: 'Mid Dress', price: 799, category: 'Dresses', image: productImages.midDress, description: 'A timeless midi silhouette with an effortless shape.' },
  { id: 'p5', name: 'Wide Leg Pants', price: 699, category: 'Bottoms', image: productImages.wideLegPants, description: 'Flowy wide-leg pants with an elevated everyday feel.' },
  { id: 'p6', name: 'Sweater', price: 699, category: 'Tops', image: productImages.sweater, description: 'A cozy knit for cooler days and relaxed styling.' },
  { id: 'p7', name: 'Cardigan', price: 749, category: 'Tops', image: productImages.cardigan, description: 'A lightweight cardigan for timeless layering.' },
  { id: 'p8', name: 'Shoulder Bag', price: 899, category: 'Accessories', image: productImages.shoulderBag, description: 'Structured shoulder bag with a polished everyday shape.' }
];

export const peso = (value) => `₱${Number(value || 0).toLocaleString('en-PH')}`;
