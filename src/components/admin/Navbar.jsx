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

  return (
    <nav className="navbar navbar-expand-lg bg-primary navbar-dark">
      <div className="container">
        <a className="navbar-brand fw-bold" href="#">
          Eventify
        </a>

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
          className="collapse navbar-collapse position-relative"
          id="navbarSupportedContent"
        >
          {/* Menu Tengah */}
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-2 position-lg-absolute start-lg-50 translate-middle-lg-x">
            <li className="nav-item">
              <NavLink
                to="/admin/home"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <i className="bi bi-house-fill"></i> Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <i className="bi bi-calendar4-week"></i> Explore Events
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/community"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <i className="bi bi-chat"></i> Community
              </NavLink>
            </li>
          </ul>

          {/* Profile Paling Kanan */}
          <ul className="navbar-nav ms-auto">
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
                  <a className="dropdown-item" href="#">
                    <i className="bi bi-person"></i> My Profile
                  </a>
                </li>

                <li>
                  <a className="dropdown-item" href="#">
                    <i className="bi bi-ticket"></i> My Tickets
                  </a>
                </li>

                <li>
                  <a className="dropdown-item" href="#">
                    <i className="bi bi-bookmark"></i> Saved Events
                  </a>
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
