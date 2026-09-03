import client from "./client";

export const getProfile = () => client.get("/auth/users/me");

export const updateProfile = (data) => client.put("/auth/users/me", data);
