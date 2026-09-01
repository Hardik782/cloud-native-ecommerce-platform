// src/pages/Home/Home.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts } from "../../api/products";
import ProductCard from "../../components/product/ProductCard";
import GenderTabs from "../../components/product/GenderTabs";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch products
        const productsRes = await getProducts({
          limit: 8,
          sort_by: "created_at",
          sort_order: "desc"
        });
        const products = productsRes.data?.products || productsRes.data || [];
        setFeatured(products);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="section">
        <h2 className="section__title">New Arrivals</h2>
        <p className="empty-state">Error loading products: {error}</p>
      </div>
    );
  }

  const handleShopBy = (tab) => {
    navigate(tab === "All" ? "/products" : `/products?gender=${tab.toLowerCase()}`);
  };

  return (
    <div>
      <section className="hero">
        <div className="hero__content">
          <h1>Quiet Luxury, Considered Style</h1>
          <p>Minimal pieces built to last beyond a season.</p>
          <Link to="/products" className="button button--primary">
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* Shop by Gender Section */}
      <section className="section" style={{ paddingTop: '20px', paddingBottom: '30px' }}>
        <h2 className="section__title" style={{ fontSize: '1.3rem', marginBottom: '16px' }}>
          Shop by
        </h2>
        <GenderTabs active="All" onChange={handleShopBy} />
      </section>

      {/* New Arrivals Section */}
      <section className="section">
        <h2 className="section__title">New Arrivals</h2>
        {featured.length === 0 ? (
          <p className="empty-state">No products to show yet.</p>
        ) : (
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
