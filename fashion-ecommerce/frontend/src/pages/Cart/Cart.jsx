// src/pages/Cart/Cart.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { formatINR } from "../../utils/price";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="section">
        <h1 className="section__title">Your Cart</h1>
        <p className="empty-state">Your cart is empty.</p>
        <Link to="/products" className="button button--primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const totalINR = formatINR(totalPrice);

  return (
    <div className="section">
      <h1 className="section__title">Your Cart</h1>
      <div className="cart-list">
        {items.map((item) => (
          <div key={item.key} className="cart-item">
            <img
              src={item.image || "/product-images/placeholder.jpg"}
              alt={item.name}
              className="cart-item__image"
              onError={(e) => {
                e.target.src = '/product-images/placeholder.jpg';
              }}
            />
            <div className="cart-item__info">
              <p className="cart-item__name">{item.name}</p>
              {item.size && (
                <p className="cart-item__meta">Size: {item.size}</p>
              )}
              <p className="cart-item__price">
                {formatINR(item.price)}
              </p>
            </div>
            <div className="quantity-control">
              <button
                onClick={() => updateQuantity(item.key, item.quantity - 1)}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.key, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              className="link-button cart-item__remove"
              onClick={() => removeFromCart(item.key)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <p>Total</p>
        <p className="cart-summary__total">{totalINR}</p>
      </div>
      <button className="button button--primary">Checkout</button>
    </div>
  );
};

export default Cart;