import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import defaultAvatar from "../assets/images/Default-Avatar.png";
import Swal from "sweetalert2";

function MyProfile() {
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    biography: "",
  });

  const [avatar, setAvatar] = useState(null);

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

      setFormData({
        name: data.data.name || "",
        email: data.data.email || "",
        biography: data.data.bio || "",
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3005/api/auth/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          biography: formData.biography,
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
          biography: "",
        });

        window.location.href = "/profile";
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

  const changePW = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:3005/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword,
          }),
        },
      );

      const data = await response.json();

      if (response.status >= 200 && response.status < 300) {
        await Swal.fire({
          icon: "success",
          text: data.message,
        });

        setFormData({
          name: "",
          email: "",
          biography: "",
        });

        window.location.href = "/profile";
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

  const uploadAvatar = async (e) => {
    e.preventDefault();

    if (!avatar) {
      Swal.fire({
        icon: "warning",
        text: "Please choose an image first.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", avatar);

    try {
      const response = await fetch(
        "http://localhost:3005/api/auth/change-avatar",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          text: data.message,
        });

        window.location.reload();
      } else {
        Swal.fire({
          icon: "error",
          text: data.message,
        });
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        text: "Unable to connect to the server.",
      });
    }
  };

  const handleSubmitOrganizer = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();

      form.append("organizerName", formData.organizerName);
      form.append("ktpNumber", formData.ktpNumber);
      form.append("ktpImage", formData.ktpImage);
      form.append("phoneNumber", formData.phoneNumber);
      form.append("address", formData.address);
      form.append("socialMedia", formData.socialMedia);

      const response = await fetch(
        "http://localhost:3005/api/auth/register-organizer",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: form,
        },
      );

      const data = await response.json();

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          text: data.message,
        });

        setFormData({
          organizerName: "",
          ktpNumber: "",
          ktpImage: null,
          phoneNumber: "",
          address: "",
          socialMedia: "",
        });

        window.location.href = "/profile";
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
        text: "Unable to connect to the server. Please try again later.",
      });
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <div className="card border-0 shadow rounded-4 overflow-hidden">
              <div className="card-header bg-primary text-white">
                <div className="text-center">
                  {user && (
                    <img
                      src={`../../server/public${user.avatar}`}
                      alt={user.name}
                      className="rounded-circle my-4 shadow"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                <div className="text-center mb-3">
                  {user ? (
                    <>
                      <button
                        className="btn btn-outline-light rounded-pill px-4"
                        data-bs-toggle="modal"
                        data-bs-target="#changeAvatar"
                      >
                        <i class="bi bi-image me-2"></i>
                        Change Avatar
                      </button>
                    </>
                  ) : (
                    <span></span>
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
                                    <span className="badge bg-primary px-3 py-2">
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

                    <div className="d-flex justify-content-end mt-4 gap-3">
                      <button
                        className="btn btn-outline-primary rounded-pill px-4"
                        data-bs-toggle="modal"
                        data-bs-target="#registerOrganizerModal"
                      >
                        <i class="bi bi-file-earmark-text me-2"></i>
                        Register as Organizer
                      </button>
                      <button
                        className="btn btn-outline-primary rounded-pill px-4"
                        data-bs-toggle="modal"
                        data-bs-target="#changePasswordModal"
                      >
                        <i className="bi bi-key me-2"></i>
                        Change Password
                      </button>
                      <button
                        className="btn btn-outline-primary rounded-pill px-4"
                        data-bs-toggle="modal"
                        data-bs-target="#editProfileModal"
                      >
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
      {/* Modal Change Avatar */}
      <div
        className="modal fade"
        id="changeAvatar"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5 fw-semibold">Change Avatar</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <form onSubmit={uploadAvatar}>
              <div className="modal-body">
                <label className="form-label fw-semibold">Image Profile</label>
                <br />
                <input
                  type="file"
                  className="form-control mb-3"
                  name="avatar"
                  onChange={(e) => setAvatar(e.target.files[0])}
                  required
                />

                {/* <label className="form-label fw-semibold">Avatar</label>
              <br />
              <input type="file" className="form-control mb-3" /> */}

                {/* <label className="form-label fw-semibold">Password</label>
              <br />
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Enter your password"
              /> */}
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Modal Register as Organizer */}
      <div
        className="modal fade"
        id="registerOrganizerModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5 fw-semibold">
                Register as Organizer
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <form onSubmit={handleSubmitOrganizer}>
              <div className="modal-body">
                <label className="form-label fw-semibold">Organizer Name</label>
                <br />
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your organizer name"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">KTP Number</label>
                <br />
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your KTP number"
                  name="ktpNumber"
                  value={formData.ktpNumber}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">KTP Image</label>
                <br />
                <input
                  type="file"
                  className="form-control mb-3"
                  name="ktpImage"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ktpImage: e.target.files[0],
                    })
                  }
                  required
                />

                <label className="form-label fw-semibold">Phone Number</label>
                <br />
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your phone number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">Address</label>
                <br />
                <textarea
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">Social Media</label>
                <br />
                <textarea
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your social media links"
                  name="socialMedia"
                  value={formData.socialMedia}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Modal Edit Profile */}
      <div
        className="modal fade"
        id="editProfileModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5 fw-semibold">Edit Profile</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <label className="form-label fw-semibold">Name</label>
                <br />
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">Email</label>
                <br />
                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="Enter your email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">Biography</label>
                <br />
                <textarea
                  className="form-control mb-3"
                  rows="4"
                  placeholder="Write a short biography about yourself"
                  name="biography"
                  value={formData.biography}
                  onChange={handleChange}
                  required
                ></textarea>

                {/* <label className="form-label fw-semibold">Avatar</label>
              <br />
              <input type="file" className="form-control mb-3" /> */}

                {/* <label className="form-label fw-semibold">Password</label>
              <br />
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Enter your password"
              /> */}
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Modal Change Password*/}
      <div
        className="modal fade"
        id="changePasswordModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5 fw-semibold">Change Password</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>

            <form onSubmit={changePW}>
              <div className="modal-body">
                <label className="form-label fw-semibold">Old Password</label>
                <br />
                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Enter your old password"
                  name="oldPassword"
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">New Password</label>
                <br />
                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Enter your new password"
                  name="newPassword"
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">
                  Confirm New Password
                </label>
                <br />
                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Confirm your new password"
                  name="confirmPassword"
                  onChange={handleChange}
                  required
                ></input>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default MyProfile;
