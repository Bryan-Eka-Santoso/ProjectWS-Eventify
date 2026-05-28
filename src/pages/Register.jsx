import React, { useEffect } from "react";
import logoEventify from "../assets/images/Logo-Eventify.png";

function Register() {
  useEffect(() => {
    document.title = "Daftar | Eventify";
  }, []);
  return (
    <>
      <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden w-100">
          <div className="card-body p-0">
            <div className="row g-0">
              <div className="col-lg-6 bg-light d-flex align-items-center justify-content-center">
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
                  <h3 className="fw-bold mb-2">Daftar di Eventify</h3>

                  <p className="text-muted mb-4">
                    Buat akun baru untuk mulai menggunakan Eventify.
                  </p>

                  <div className="btn-group w-100 mb-4" role="group">
                    <a href="/login" className="btn btn-outline-primary">
                      Masuk
                    </a>
                    <a href="/register" className="btn btn-primary">
                      Daftar
                    </a>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Nama Lengkap
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Masukkan Nama Lengkap"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope-at"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Masukkan Email"
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
                        className="form-control"
                        placeholder="Masukkan Password"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Konfirmasi Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Masukkan Konfirmasi Password"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value=""
                        id="checkDefault"
                      />
                      <label className="form-check-label">
                        Saya menyetujui{" "}
                        <a
                          href="#"
                          className="text-decoration-none"
                          data-bs-toggle="modal"
                          data-bs-target="#syaratKetentuanModal"
                        >
                          Syarat dan Ketentuan
                        </a>
                      </label>
                    </div>
                  </div>

                  <div className="d-grid gap-3">
                    <button className="btn btn-primary" type="button">
                      Daftar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal */}
      <div
        className="modal fade"
        id="syaratKetentuanModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">Syarat dan Ketentuan</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">...</div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
