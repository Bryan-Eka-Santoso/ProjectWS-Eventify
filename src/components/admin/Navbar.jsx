import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3005/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("token");

      await Swal.fire({
        icon: "success",
        text: "Logout successful",
      });

      navigate("/login");
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        text: "Logout failed. Please try again.",
      });
    }
  };

  const linkClass = ({ isActive }) =>
    `nav-link text-nowrap ${isActive ? "active fw-bold" : ""}`;

  return (
    <nav className="navbar navbar-expand-lg bg-primary navbar-dark shadow-sm">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/admin/home">
          Eventify
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#adminNavbarContent"
          aria-controls="adminNavbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="adminNavbarContent">
          {/* Menu Tengah */}
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-1">
            {/* <li className="nav-item">
              <NavLink to="/admin/home" className={linkClass}>
                <i className="bi bi-house-fill me-1"></i>
                Home
              </NavLink>
            </li> */}

            <li className="nav-item">
              <NavLink to="/admin/users" className={linkClass}>
                <i className="bi bi-people me-1"></i>
                Users
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/admin/categories" className={linkClass}>
                <i className="bi bi-tags me-1"></i>
                Categories
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/admin/discounts" className={linkClass}>
                <i className="bi bi-percent me-1"></i>
                Discounts
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/admin/events" className={linkClass}>
                <i className="bi bi-calendar-check me-1"></i>
                Events
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/admin/transactions" className={linkClass}>
                <i className="bi bi-credit-card me-1"></i>
                Transactions
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/admin/posts" className={linkClass}>
                <i className="bi bi-newspaper me-1"></i>
                Posts
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/admin/chat-rooms" className={linkClass}>
                <i className="bi bi-chat-dots me-1"></i>
                Chat Rooms
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/admin/cancellation-requests" className={linkClass}>
                <i className="bi bi-exclamation-triangle me-1"></i>
                Cancellations
              </NavLink>
            </li>
          </ul>

          {/* Profile Paling Kanan */}
          <ul className="navbar-nav ms-auto">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle text-nowrap"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle me-1"></i>
                Profile
              </a>

              {/* Dropdown ke kiri */}
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <NavLink className="dropdown-item" to="/profile">
                    <i className="bi bi-person me-2"></i>
                    My Profile
                  </NavLink>
                </li>

                <li>
                  <NavLink className="dropdown-item" to="/events">
                    <i className="bi bi-calendar4-week me-2"></i>
                    Explore Events
                  </NavLink>
                </li>

                <li>
                  <NavLink className="dropdown-item" to="/community">
                    <i className="bi bi-chat me-2"></i>
                    Community
                  </NavLink>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <button
                    className="dropdown-item text-danger"
                    type="button"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
