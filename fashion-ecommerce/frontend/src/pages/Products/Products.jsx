// src/pages/Products/Products.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../../api/products";
import ProductCard from "../../components/product/ProductCard";
import GenderTabs from "../../components/product/GenderTabs";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const SORT_OPTIONS = [
  { value: "created_at-desc", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const gender = searchParams.get("gender") || "All";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "created_at-desc";
  const category = searchParams.get("category") || "";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (gender !== "All") params.gender = gender.toLowerCase();
      if (search) params.search = search;
      if (category) params.category = category;
      if (sort) {
        const [sort_by, sort_order] = sort.split("-");
        params.sort_by = sort_by;
        params.sort_order = sort_order;
      }
      
      console.log('Fetching with params:', params);
      const res = await getProducts(params);
      const productsData = res.data?.products || res.data || [];
      setProducts(productsData);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [gender, search, sort, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="section">
      <h1 className="section__title">Shop All</h1>

      <GenderTabs active={gender} onChange={(g) => updateParam("gender", g)} />

      <div className="products-toolbar">
        <input
          type="text"
          placeholder="Search within results..."
          value={search}
          onChange={(e) => updateParam("search", e.target.value)}
          className="products-toolbar__search"
        />
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="products-toolbar__sort"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="empty-state">Error: {error}</p>
      ) : products.length === 0 ? (
        <p className="empty-state">No products found.</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;