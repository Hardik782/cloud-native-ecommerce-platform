// src/pages/ProductDetail/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProduct } from "../../api/products";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getINRPrice, getINRComparePrice } from "../../utils/price";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await getProduct(id);
        setProduct(res.data);
        // Get sizes from product sizes array
        if (res.data.sizes && res.data.sizes.length > 0) {
          setSelectedSize(res.data.sizes[0].size || res.data.sizes[0]);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!product) return <p className="empty-state">Product not found.</p>;

  // Get image URL
  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
      if (primaryImage && primaryImage.image_url) {
        return primaryImage.image_url;
      }
    }
    if (product.image_url) return product.image_url;
    if (product.image) return product.image;
    return '/product-images/placeholder.jpg';
  };

  const image = getImageUrl();
  const wishlisted = isWishlisted(product.id);
  const availableSizes = product.sizes?.map(s => s.size || s) || [];
  const inrPrice = getINRPrice(product);
  const inrComparePrice = getINRComparePrice(product);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-detail">
      <div className="product-detail__image-wrap">
        <img 
          src={image} 
          alt={product.name} 
          className="product-detail__image"
          onError={(e) => {
            e.target.src = '/product-images/placeholder.jpg';
          }}
        />
      </div>

      <div className="product-detail__info">
        <button className="link-button" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <h1>{product.name}</h1>
        <p className="product-detail__price">
          {inrPrice}
          {inrComparePrice && (
            <span className="product-detail__compare-price">
              {inrComparePrice}
            </span>
          )}
        </p>
        <p className="product-detail__description">{product.description}</p>

        {availableSizes.length > 0 && (
          <div className="product-detail__sizes">
            <span>Size</span>
            <div className="size-options">
              {availableSizes.map((s) => (
                <button
                  key={s}
                  className={`size-option ${
                    selectedSize === s ? "size-option--active" : ""
                  }`}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="product-detail__quantity">
          <span>Quantity</span>
          <div className="quantity-control">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              -
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
        </div>

        <div className="product-detail__actions">
          <button className="button button--primary" onClick={handleAddToCart}>
            {added ? "Added to Cart" : "Add to Cart"}
          </button>
          <button
            className={`button button--outline ${
              wishlisted ? "button--outline-active" : ""
            }`}
            onClick={() => toggleWishlist(product)}
          >
            {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;