import client from "./client";

export const getMyOrders = () => client.get("/orders/my-orders");
