import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logoEventify from "../assets/images/Logo-Eventify.png";
import Swal from "sweetalert2";
import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    document.title = "Login | Eventify";
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await fetch(
        `http://localhost:${process.env.PORT}/api/auth/google-login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        },
      );

      const data = await response.json();

      if (response.status >= 200 && response.status < 300) {
        localStorage.setItem("token", data.token);

        await Swal.fire({
          icon: "success",
          text: data.message,
        });

        window.location.href = "/";
      } else {
        Swal.fire({
          icon: "warning",
          text: data.message,
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        text: "Unable to login with Google. Please try again later.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:${process.env.PORT}/api/auth/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        },
      );

      const data = await response.json();

      if (response.status >= 200 && response.status < 300) {
        localStorage.setItem("token", data.token);

        await Swal.fire({
          icon: "success",
          text: data.message,
        });

        setFormData({
          email: "",
          password: "",
        });

        window.location.href = "/";
      } else if (response.status >= 400 && response.status < 500) {
        Swal.fire({
          icon: "warning",
          text: data.message,
        });
      } else if (response.status >= 500) {
        Swal.fire({
          icon: "error",
          text: data.message,
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        text: "Unable to connect to the server. Please try again later.",
      });
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden w-100">
        <div className="card-body p-0">
          <div className="row g-0">
            <div className="col-lg-6 bg-light d-flex align-items-center">
              <div className="text-center p-4 p-md-5 w-100">
                <img
                  src={logoEventify}
                  alt="Eventify Logo"
                  className="img-fluid bg-white border rounded-4 shadow-sm p-3 mb-4"
                  style={{
                    maxWidth: "20rem",
                  }}
                />
              </div>
            </div>

            <div className="col-lg-6">
              <div className="p-4 p-md-5">
                <h3 className="fw-bold mb-2">Welcome to Eventify</h3>

                <p className="text-muted mb-4">
                  Please login or register to continue.
                </p>

                <div className="btn-group w-100 mb-4" role="group">
                  <a href="/login" className="btn btn-primary">
                    Login
                  </a>
                  <a href="/register" className="btn btn-outline-primary">
                    Register
                  </a>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope-at"></i>
                      </span>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="Enter Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Enter Password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mb-4">
                    <a
                      href="/forgot-password"
                      className="text-decoration-none small"
                    >
                      Forgot Password?
                    </a>
                  </div>

                  <div className="d-grid gap-3">
                    <button className="btn btn-primary" type="submit">
                      Login
                    </button>

                    <div className="d-flex align-items-center text-muted">
                      <hr className="flex-grow-1" />
                      <span className="mx-3 small">or</span>
                      <hr className="flex-grow-1" />
                    </div>

                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => {
                        Swal.fire({
                          icon: "error",
                          text: "Google login failed.",
                        });
                      }}
                    />

                    {/* <div className="text-center">
                      <a href="/" className="text-decoration-none text-muted">
                        Continue as Guest
                      </a>
                    </div> */}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
