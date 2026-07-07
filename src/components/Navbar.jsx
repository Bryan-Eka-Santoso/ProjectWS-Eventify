import React from "react";
import { NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { AUTH_USER } from "../config/auth";

function Navbar() {
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

        <div
          className="collapse navbar-collapse"
          id="navbarSupportedContent"
        >
          {/* Menu Tengah */}
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-2">
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
                <i className="bi bi-calendar4-week me-1"></i>
                Events
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
          </ul>

          {/* Kanan: Notification + Profile */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            <NotificationBell />

            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-white text-decoration-none d-flex align-items-center gap-1"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle"></i>
                  <span>Profile</span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                  <li className="px-3 py-2 border-bottom">
                    <div className="fw-bold">
                      {AUTH_USER?.name || "Guest"}
                    </div>
                    <small className="text-muted">
                      {AUTH_USER?.role || "user"}
                    </small>
                  </li>

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

                  {(AUTH_USER?.role === "organizer" ||
                    AUTH_USER?.role === "admin") && (
                    <li>
                      <NavLink
                        className="dropdown-item"
                        to="/events/my-events"
                      >
                        <i className="bi bi-calendar-check me-2"></i>
                        My Events
                      </NavLink>
                    </li>
                  )}

                  {AUTH_USER?.role === "admin" && (
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
                    <NavLink className="dropdown-item text-danger" to="/login">
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </NavLink>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;