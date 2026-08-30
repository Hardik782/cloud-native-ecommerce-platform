// src/utils/price.js

// 1 USD = 95.78 INR
const USD_TO_INR = 95.78;

export const convertToINR = (usdPrice) => {
  if (!usdPrice) return '₹0';
  const inr = parseFloat(usdPrice) * USD_TO_INR;
  return formatINR(inr);
};

export const formatINR = (amount) => {
  if (isNaN(amount) || !isFinite(amount)) return '₹0';
  
  // Round to nearest whole rupee
  const rounded = Math.round(amount);
  
  // Format with Indian number system (lakhs, crores)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  
  return formatted;
};

export const getINRPrice = (product) => {
  if (!product) return '₹0';
  const price = product.price || 0;
  return convertToINR(price);
};

export const getINRComparePrice = (product) => {
  if (!product || !product.compare_price) return null;
  return convertToINR(product.compare_price);
};

export default { convertToINR, formatINR, getINRPrice, getINRComparePrice };