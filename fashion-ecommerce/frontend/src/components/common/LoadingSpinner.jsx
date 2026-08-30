import React from "react";

const LoadingSpinner = ({ size = 32 }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "48px 0",
    }}
  >
    <div
      style={{
        width: size,
        height: size,
        border: "2px solid #e5e5e5",
        borderTopColor: "#0d0d0d",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingSpinner;
