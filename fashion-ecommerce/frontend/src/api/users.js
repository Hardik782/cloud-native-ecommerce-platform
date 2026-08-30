import client from "./client";

export const getProfile = () => client.get("/users/me");

export const updateProfile = (data) => client.put("/users/me", data);
