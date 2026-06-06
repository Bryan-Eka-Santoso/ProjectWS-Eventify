import React, { useEffect } from "react";
import logoEventify from "../assets/images/Logo-Eventify.png";

function Login() {
  useEffect(() => {
    document.title = "Login | Eventify";
  }, []);
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

                <form action="" method="POST">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Email Address
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i class="bi bi-envelope-at"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter Email Address"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i class="bi bi-lock"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter Password"
                        required
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mb-4">
                    <a href="#" className="text-decoration-none small">
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

                    <button className="btn btn-outline-dark" type="button">
                      <i class="bi bi-google"></i> Login with Google
                    </button>

                    <div className="text-center">
                      <a href="#" className="text-decoration-none text-muted">
                        Continue as Guest
                      </a>
                    </div>
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
