import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = ({ component: Component, ...restOfProps }) => {
  console.log(JSON.parse(sessionStorage.getItem("annote_user")))
  const isAuthenticated =
    sessionStorage.getItem("annote_user") && JSON.parse(sessionStorage.getItem("annote_admin"));
  console.log("this", isAuthenticated);

  return (
    isAuthenticated ? <Outlet /> : <Navigate to="/" />
  );
};

export default AdminRoute;