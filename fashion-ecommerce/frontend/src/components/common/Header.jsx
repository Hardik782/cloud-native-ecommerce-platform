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
              <Link to="/profile" className="site-header__profile-link" title="My Profile">
                <svg
                  className="site-header__profile-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{user?.first_name || user?.name || "Profile"}</span>
              </Link>
              <Link to="/orders">Orders</Link>
              <button onClick={handleLogout} className="link-button">
                Logout
              </button>
            </div>
          ) : (
            <div className="site-header__account">
              <Link to="/login" className="site-header__profile-link">
                <svg
                  className="site-header__profile-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Login</span>
              </Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;