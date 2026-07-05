import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function UserRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.role !== "user") {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  } catch (err) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
}

export default UserRoute;
