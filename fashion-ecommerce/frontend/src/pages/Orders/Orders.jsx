import React, { useEffect, useState } from "react";
import { getMyOrders } from "../../api/orders";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        setOrders(res.data.orders || res.data || []);
      } catch (err) {
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
      {orders.length === 0 ? (
        <p className="empty-state">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <span>Order #{order.id}</span>
                <span>{order.status}</span>
              </div>
              <p className="order-card__date">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : ""}
              </p>
              <p className="order-card__total">
                ${Number(order.total).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
