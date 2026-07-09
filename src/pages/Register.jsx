import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logoEventify from "../assets/images/Logo-Eventify.png";
import Swal from "sweetalert2";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    document.title = "Register | Eventify";
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:5000/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.status >= 200 && response.status < 300) {
        await Swal.fire({
          icon: "success",
          text: data.message,
        });

        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        window.location.href = "/login";
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
                  <h3 className="fw-bold mb-2">Register on Eventify</h3>

                  <p className="text-muted mb-4">
                    Create a new account to start using Eventify.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="btn-group w-100 mb-4" role="group">
                      <a href="/login" className="btn btn-outline-primary">
                        Login
                      </a>
                      <a href="/register" className="btn btn-primary">
                        Register
                      </a>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Full Name
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-person"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter Full Name"
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                      </div>
                    </div>

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
                          className="form-control"
                          placeholder="Enter Email Address"
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          autoComplete="off"
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
                          placeholder="Enter Password"
                          required
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Confirm Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Enter Password Confirmation"
                          required
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          autoComplete="off"
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
                          required
                        />
                        <label className="form-check-label">
                          I agree to the{" "}
                          <a
                            href="#"
                            className="text-decoration-none"
                            data-bs-toggle="modal"
                            data-bs-target="#syaratKetentuanModal"
                          >
                            Terms and Conditions
                          </a>
                        </label>
                      </div>
                    </div>

                    <div className="d-grid gap-3">
                      <button className="btn btn-primary" type="submit">
                        Register
                      </button>
                    </div>
                  </form>
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
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5 fw-semibold">
                Terms and Conditions
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              <p>
                Dengan membuat akun dan menggunakan layanan Eventify, Anda
                menyetujui syarat dan ketentuan berikut:
              </p>

              <ol>
                <li>
                  <strong>Akun Pengguna</strong>
                  <ul>
                    <li>
                      Pengguna wajib memberikan data yang benar dan akurat.
                    </li>
                    <li>
                      Pengguna bertanggung jawab atas keamanan akun dan kata
                      sandi.
                    </li>
                    <li>
                      Akun tidak boleh dipindahtangankan kepada pihak lain.
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>Penggunaan Layanan</strong>
                  <ul>
                    <li>
                      Eventify digunakan untuk mencari, mendaftar, dan mengelola
                      partisipasi dalam acara.
                    </li>
                    <li>
                      Pengguna dilarang menggunakan aplikasi untuk tujuan yang
                      melanggar hukum.
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>Pendaftaran Acara</strong>
                  <ul>
                    <li>
                      Data pendaftaran harus valid dan dapat diverifikasi.
                    </li>
                    <li>
                      Ketentuan pembatalan atau perubahan mengikuti kebijakan
                      penyelenggara acara.
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>Privasi Data</strong>
                  <ul>
                    <li>
                      Data pribadi digunakan untuk kebutuhan operasional
                      aplikasi dan penyelenggaraan acara.
                    </li>
                    <li>
                      Eventify berkomitmen menjaga keamanan data pengguna sesuai
                      kebijakan yang berlaku.
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>Pembatasan Tanggung Jawab</strong>
                  <ul>
                    <li>
                      Eventify bertindak sebagai platform penghubung antara
                      peserta dan penyelenggara acara.
                    </li>
                    <li>
                      Eventify tidak bertanggung jawab atas perubahan jadwal
                      atau pembatalan acara oleh penyelenggara.
                    </li>
                  </ul>
                </li>

                <li>
                  <strong>Perubahan Ketentuan</strong>
                  <ul>
                    <li>
                      Eventify berhak memperbarui syarat dan ketentuan
                      sewaktu-waktu.
                    </li>
                  </ul>
                </li>
              </ol>

              <p className="mb-0">
                Dengan menggunakan Eventify, Anda dianggap telah membaca,
                memahami, dan menyetujui seluruh syarat dan ketentuan yang
                berlaku.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
