import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import NotificationBell from "./NotificationBell";
import { getCurrentUser, getAuthHeaders, logoutLocal } from "../config/auth";


function Navbar() {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      logoutLocal();

      await Swal.fire({
        icon: "success",
        text: "Logout successful",
      });

      navigate("/login");
    } catch (error) {
      console.error(error);

      logoutLocal();

      Swal.fire({
        icon: "error",
        text: "Logout failed. Please try again.",
      });

      navigate("/login");
    }
  };


  return (
    <nav className="navbar navbar-expand-lg bg-primary navbar-dark shadow-sm">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/">
          Eventify
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {/* Menu Tengah */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-2">
            <li className="nav-item">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                <i className="bi bi-house-fill me-1"></i>
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                <i className="bi bi-calendar4-week"></i> Explore Events
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/community"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                <i className="bi bi-chat me-1"></i>
                Community
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/feed"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active fw-bold" : ""}`
                }
              >
                <i className="bi bi-newspaper me-1"></i>
                Feed
              </NavLink>
            </li>
          </ul>

          {/* Profile Paling Kanan */}
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {currentUser && (
              <li className="nav-item">
                <NotificationBell />
              </li>
            )}

            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle"></i> Profile
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
                  <NavLink className="dropdown-item" to="/events/my-tickets">
                    <i className="bi bi-ticket me-2"></i>
                    My Tickets
                  </NavLink>
                </li>

                <li>
                  <NavLink className="dropdown-item" to="/events/saved">
                    <i className="bi bi-bookmark me-2"></i>
                    Saved Events
                  </NavLink>
                </li>

                <li>
                  <NavLink className="dropdown-item" to="/transactions">
                    <i className="bi bi-receipt me-2"></i>
                    Transactions
                  </NavLink>
                </li>

                <li>
                  <NavLink className="dropdown-item" to="/profile/points">
                    <i className="bi bi-coin me-2"></i>
                    Point History
                  </NavLink>
                </li>

                <li>
                  <NavLink className="dropdown-item" to="/profile/followers">
                    <i className="bi bi-people me-2"></i>
                    Followers & Following
                  </NavLink>
                </li>

                {(currentUser?.role === "organizer" ||
                  currentUser?.role === "admin") && (
                  <li>
                    <NavLink className="dropdown-item" to="/events/my-events">
                      <i className="bi bi-calendar-check me-2"></i>
                      My Events
                    </NavLink>
                  </li>
                )}

                {currentUser?.role === "admin" && (
                  <li>
                    <NavLink
                      className="dropdown-item"
                      to="/admin/cancellation-requests"
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Cancellation Requests
                    </NavLink>
                  </li>
                )}

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <button
                    className="dropdown-item text-danger"
                    type="button"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i> Logout
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
