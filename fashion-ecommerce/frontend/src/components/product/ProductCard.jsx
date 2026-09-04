// src/components/product/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../contexts/WishlistContext";
import { getINRPrice } from "../../utils/price";
import GenderTag from "./GenderTag";

const ProductCard = ({ product }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  
  // STRICTLY GET IMAGE FROM DATABASE
  const getImageUrl = () => {
    // 1. Check if backend provided images array
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
      if (primaryImage && primaryImage.image_url) {
        return primaryImage.image_url;
      }
    }
    // 2. Check direct image field
    if (product.image_url) return product.image_url;
    if (product.image) return product.image;

    // 3. If database returned nothing, use placeholder
    return '/product-images/placeholder.jpg';
  };

  const image = getImageUrl();
  const inrPrice = getINRPrice(product);

  return (
    <div className="product-card">
      <div className="product-card__image-wrap">
        <Link to={`/products/${product.id}`}>
          <img 
            src={image} 
            alt={product.name} 
            className="product-card__image"
            onError={(e) => {
              e.target.src = '/product-images/placeholder.jpg';
            }}
          />
        </Link>
        <GenderTag gender={product.gender} className="product-card__gender-tag" />
        <button
          className={`product-card__wishlist ${
            wishlisted ? "product-card__wishlist--active" : ""
          }`}
          onClick={() => toggleWishlist(product)}
          aria-label="Toggle wishlist"
        >
          {wishlisted ? "\u2665" : "\u2661"}
        </button>
      </div>
      <Link to={`/products/${product.id}`} className="product-card__info">
        <p className="product-card__name">{product.name}</p>
        <p className="product-card__price">{inrPrice}</p>
      </Link>
    </div>
  );
};

export default ProductCard;