const productImages = {
  brigadeiro: require('../../assets/food/brigadeiro.jpg'),
  bolo: require('../../assets/food/bolo.jpg'),
  pote: require('../../assets/food/pote.jpg'),
  coxinha: require('../../assets/food/coxinha.jpg'),
  donuts: require('../../assets/food/donuts.jpg'),
  sanduiche: require('../../assets/food/sanduiche.jpg'),
  cafe: require('../../assets/food/cafe.jpg'),
  brownie: require('../../assets/food/brownie.jpg'),
  default: require('../../assets/food/hero.jpg'),
};

export const heroImage = require('../../assets/food/hero.jpg');
export const finishImage = require('../../assets/food/finish.jpg');

export const vendorAvatars = [
  require('../../assets/food/avatar-max.jpg'),
  require('../../assets/food/avatar-livian.jpg'),
  require('../../assets/food/avatar-luan.jpg'),
  require('../../assets/food/avatar-cleiton.jpg'),
];

export function getProfileImage(avatarUrl?: string | null, fallbackIndex = 0) {
  const cleanUrl = avatarUrl?.trim();

  if (cleanUrl) {
    return { uri: cleanUrl };
  }

  return vendorAvatars[fallbackIndex % vendorAvatars.length];
}

export function getProductImage(title: string, imageUrl?: string | null) {
  if (imageUrl) {
    return { uri: imageUrl };
  }

  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('brigadeiro') || normalized.includes('beijinho')) return productImages.brigadeiro;
  if (normalized.includes('bolo de pote') || normalized.includes('pote')) return productImages.pote;
  if (normalized.includes('brownie') || normalized.includes('cookie')) return productImages.brownie;
  if (normalized.includes('bolo') || normalized.includes('torta')) return productImages.bolo;
  if (normalized.includes('coxinha') || normalized.includes('salgado') || normalized.includes('empada') || normalized.includes('pastel')) return productImages.coxinha;
  if (normalized.includes('donut') || normalized.includes('rosquinha')) return productImages.donuts;
  if (normalized.includes('sanduiche') || normalized.includes('sanduba') || normalized.includes('lanche')) return productImages.sanduiche;
  if (normalized.includes('cafe') || normalized.includes('suco') || normalized.includes('bebida')) return productImages.cafe;

  return productImages.default;
}
