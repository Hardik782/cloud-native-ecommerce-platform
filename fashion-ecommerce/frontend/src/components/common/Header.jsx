import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(search)}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="site-header__top">
        <Link to="/" className="site-header__logo">
          Fashion Store
        </Link>

        <form className="site-header__search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" aria-label="Search">
            &#8594;
          </button>
        </form>

        <nav className="site-header__actions">
          <Link to="/wishlist" className="site-header__icon-link">
            Wishlist
            {wishlistItems.length > 0 && (
              <span className="badge">{wishlistItems.length}</span>
            )}
          </Link>
          <Link to="/cart" className="site-header__icon-link">
            Cart
            {totalItems > 0 && <span className="badge">{totalItems}</span>}
          </Link>
          {isAuthenticated ? (
            <div className="site-header__account">
              <Link to="/profile">{user?.first_name || user?.name || "Profile"}</Link>
              <Link to="/orders">Orders</Link>
              <button onClick={handleLogout} className="link-button">
                Logout
              </button>
            </div>
          ) : (
            <div className="site-header__account">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;