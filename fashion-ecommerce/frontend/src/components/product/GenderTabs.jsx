// src/components/product/GenderTabs.jsx
import React from "react";

const TABS = ["Men", "Women", "Unisex", "All"];

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