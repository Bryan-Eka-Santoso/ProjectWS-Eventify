import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function OrganizerRoute() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.role !== "organizer") {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  } catch (error) {
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }
}

export default OrganizerRoute;
