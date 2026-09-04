// src/components/product/GenderTag.jsx
import React from "react";

const GENDER_META = {
  men: { label: "Men", mod: "product-tag--men" },
  women: { label: "Women", mod: "product-tag--women" },
  unisex: { label: "Unisex", mod: "product-tag--unisex" },
};

const DEFAULT_GENDER = "unisex";

/**
 * Small visual tag that shows which gender a product belongs to.
 * Uses the `gender` field returned by the products API
 * (one of: men | women | unisex).
 */
const GenderTag = ({ gender, className = "" }) => {
  const key = String(gender || "").toLowerCase();
  const meta = GENDER_META[key] || GENDER_META[DEFAULT_GENDER];

  return (
    <span className={`product-tag ${meta.mod} ${className}`.trim()}>
      {meta.label}
    </span>
  );
};

export default GenderTag;