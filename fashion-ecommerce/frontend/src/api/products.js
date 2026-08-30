// src/api/products.js
import client from "./client";

export const getProducts = (params = {}) =>
  client.get("/products/", { params });

export const getProduct = (id) => client.get(`/products/${id}`);

export const getCategories = (params = {}) =>
  client.get("/products/categories/", { params });