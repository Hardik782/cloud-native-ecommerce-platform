import React, { useEffect, useState } from "react";
import { getMyOrders } from "../../api/orders";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        const data = res.data;
        // Orders API returns { orders: [...] }; guard against other shapes
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : [];
        setOrders(list);
      } catch (err) {
        setError(err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="section">
      <h1 className="section__title">Order History</h1>
      {error ? (
        <p className="empty-state">Error loading orders: {error}</p>
      ) : orders.length === 0 ? (
        <p className="empty-state">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <span>Order #{order.id}</span>
                <span>{order.status || "—"}</span>
              </div>
              <p className="order-card__date">
                {(order.createdAt || order.created_at)
                  ? new Date(order.createdAt || order.created_at).toLocaleDateString()
                  : ""}
              </p>
              <p className="order-card__total">
                ${Number(order.total || 0).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
