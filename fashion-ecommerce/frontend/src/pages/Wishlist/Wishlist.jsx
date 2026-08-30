// src/pages/Wishlist/Wishlist.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../contexts/WishlistContext";
import ProductCard from "../../components/product/ProductCard";

const Wishlist = () => {
  const { items } = useWishlist();

  return (
    <div className="section">
      <h1 className="section__title">Your Wishlist</h1>
      {items.length === 0 ? (
        <>
          <p className="empty-state">Your wishlist is empty.</p>
          <Link to="/products" className="button button--primary">
            Browse Products
          </Link>
        </>
      ) : (
        <div className="product-grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;