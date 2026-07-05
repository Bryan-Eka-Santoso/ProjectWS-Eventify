import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MyProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.title = "My Profile | Eventify";

    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const response = await fetch("http://localhost:3005/api/auth/profile", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log(localStorage.getItem("token"));
      console.log("Status:", response.status);

      const data = await response.json();

      console.log(data);

      setUser(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="card border-0 shadow rounded-4 overflow-hidden">
              <div className="card-header bg-light text-white d-flex align-items-center justify-content-center">
                <div className="text-center">
                  {user && (
                    <img
                      src={`http://localhost:3005/uploads/avatar/${user.avatar}`}
                      alt=""
                    />
                  )}
                </div>
              </div>

              <div className="card-body px-5 pb-5">
                {user ? (
                  <>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="card h-100 border rounded-4">
                          <div className="card-body">
                            <h5 className="fw-semibold mb-3">
                              <i className="bi bi-person-circle me-2"></i>
                              About Me
                            </h5>

                            <p className="text-muted mb-0">
                              {user.bio || "No biography available."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card h-100 border rounded-4">
                          <div className="card-body">
                            <h5 className="fw-semibold mb-3">
                              <i className="bi bi-award me-2"></i>
                              Account Information
                            </h5>

                            <table className="table table-borderless mb-0">
                              <tbody>
                                <tr>
                                  <td className="fw-semibold">Name</td>
                                  <td>{user.name}</td>
                                </tr>

                                <tr>
                                  <td className="fw-semibold">Email</td>
                                  <td>{user.email}</td>
                                </tr>

                                <tr>
                                  <td className="fw-semibold">Points</td>
                                  <td>
                                    <span className="badge bg-primary fs-6 px-3 py-2">
                                      {user.points} pts
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                      <button className="btn btn-primary rounded-pill px-4">
                        <i className="bi bi-pencil-square me-2"></i>
                        Edit Profile
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-primary mb-3"
                      role="status"
                    ></div>

                    <h5 className="fw-semibold">Loading profile...</h5>

                    <p className="text-muted">
                      Please wait while we retrieve your profile information.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default MyProfile;
