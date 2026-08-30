// src/components/product/GenderTabs.jsx
import React from "react";

const TABS = ["All", "Women", "Men", "Unisex"];

const GenderTabs = ({ active, onChange }) => (
  <div className="gender-tabs">
    {TABS.map((tab) => (
      <button
        key={tab}
        className={`gender-tabs__item ${
          active === tab ? "gender-tabs__item--active" : ""
        }`}
        onClick={() => onChange(tab)}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default GenderTabs;