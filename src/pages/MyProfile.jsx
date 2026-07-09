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
    bio: "",

    oldPassword: "",
    newPassword: "",
    confirmPassword: "",

    organizer_name: "",
    ktp_number: "",
    ktp_image_url: null,
    phone_number: "",
    address: "",
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

      if (response.status === 404 || response.status === 401) {
        localStorage.removeItem("token");

        await Swal.fire({
          icon: "info",
          text: "Your account is no longer available. Please login again.",
        });

        window.location.replace("/login");
        return;
      }

      const data = await response.json();

      setUser(data.data);
      setFormData({
        name: data.data.name || "",
        email: data.data.email || "",
        bio: data.data.bio || "",
        organizer_name:
          data.data.OrganizerApplications?.[0]?.organizer_name || "",
        phone_number: data.data.OrganizerApplications?.[0]?.phone_number || "",
        address: data.data.OrganizerApplications?.[0]?.address || "",
      });
    } catch (error) {
      console.error(error);
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          organizer_name: formData.organizer_name,
          phone_number: formData.phone_number,
          address: formData.address,
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
          bio: "",
          organizer_name: "",
          phone_number: "",
          address: "",
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
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            oldPassword: formData.oldPassword,
            newPassword: formData.newPassword,
          }),
          credentials: "include",
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
          bio: "",
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
          credentials: "include",
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

      form.append("organizer_name", formData.organizer_name);
      form.append("ktp_number", formData.ktp_number);
      form.append("ktp_image_url", formData.ktp_image_url);
      form.append("phone_number", formData.phone_number);
      form.append("address", formData.address);

      const response = await fetch(
        "http://localhost:3005/api/auth/register-organizer",
        {
          method: "POST",
          credentials: "include",
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
          organizer_name: "",
          ktp_number: "",
          ktp_image_url: null,
          phone_number: "",
          address: "",
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

  const deleteAccount = async () => {
    try {
      const response = await fetch("http://localhost:3005/api/auth/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: "include",
      });

      console.log("Status:", response.status);

      const text = await response.text();
      console.log("Response:", text);

      const data = JSON.parse(text);

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          text: data.message,
        });

        localStorage.removeItem("token");
        window.location.href = "/login";
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
        text: error.message,
      });
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          {user?.role === "organizer" &&
            user?.OrganizerApplications?.length > 0 && (
              <div className="col-lg-10 mb-4">
                <div className="card h-100 border rounded-4">
                  <div className="card-body">
                    <h5 className="fw-semibold mb-4">
                      <i className="bi bi-building me-2"></i>
                      Organizer Information
                    </h5>

                    <table className="table">
                      <tbody>
                        <tr>
                          <td width="220">
                            <b>Organizer Name</b>
                          </td>
                          <td>
                            {user.OrganizerApplications[0].organizer_name}
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <b>Phone Number</b>
                          </td>
                          <td>{user.OrganizerApplications[0].phone_number}</td>
                        </tr>

                        <tr>
                          <td>
                            <b>Address</b>
                          </td>
                          <td>{user.OrganizerApplications[0].address}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          <div className="col-lg-10">
            <div className="card border-0 shadow rounded-4 overflow-hidden">
              <div className="card-header bg-primary text-white">
                <div className="text-center">
                  {user && (
                    <img
                      src={
                        user.avatar
                          ? user.google_id !== null
                            ? user.avatar
                            : `http://localhost:3005${user.avatar}`
                          : defaultAvatar
                      }
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
                    !user.google_id && (
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
                    )
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
                              {user.bio || "No bio available."}
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
                      {user?.role === "user" && (
                        <button
                          className="btn btn-outline-primary px-4"
                          data-bs-toggle="modal"
                          data-bs-target="#registerOrganizerModal"
                        >
                          <i className="bi bi-building me-2"></i>
                          Register as Organizer
                        </button>
                      )}
                      {!user?.google_id && (
                        <button
                          className="btn btn-outline-primary px-4"
                          data-bs-toggle="modal"
                          data-bs-target="#changePasswordModal"
                        >
                          <i className="bi bi-key me-2"></i>
                          Change Password
                        </button>
                      )}
                      <button
                        className="btn btn-outline-primary px-4"
                        data-bs-toggle="modal"
                        data-bs-target="#editProfileModal"
                      >
                        <i className="bi bi-pencil-square me-2"></i>
                        Edit Profile
                      </button>
                      <button
                        className="btn btn-outline-danger px-4"
                        data-bs-toggle="modal"
                        data-bs-target="#deleteAccountModal"
                      >
                        <i className="bi bi-trash me-2"></i>
                        Delete Account
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
      <form onSubmit={handleSubmitOrganizer}>
        <div
          className="modal fade"
          id="registerOrganizerModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
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

              <div className="modal-body">
                <label className="form-label fw-semibold">Organizer Name</label>
                <br />
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your organizer name"
                  name="organizer_name"
                  value={formData.organizer_name}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">KTP Number</label>
                <br />
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your KTP number"
                  name="ktp_number"
                  value={formData.ktp_number}
                  onChange={handleChange}
                  required
                />

                <label className="form-label fw-semibold">KTP Image</label>
                <br />
                <input
                  type="file"
                  className="form-control mb-3"
                  name="ktp_image_url"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ktp_image_url: e.target.files[0],
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
                  name="phone_number"
                  value={formData.phone_number}
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
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      {/* Modal Edit Profile */}
      <form onSubmit={handleSubmit}>
        <div
          className="modal fade"
          id="editProfileModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
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

                <label className="form-label fw-semibold">bio</label>
                <br />
                <textarea
                  className="form-control mb-3"
                  rows="4"
                  placeholder="Write a short bio about yourself"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  required
                ></textarea>

                {user?.role === "organizer" &&
                user?.OrganizerApplications?.length > 0 ? (
                  <>
                    <label className="form-label fw-semibold">
                      Organizer Name
                    </label>
                    <br />
                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Enter your organizer name"
                      name="organizer_name"
                      value={formData.organizer_name}
                      onChange={handleChange}
                      required
                    />
                    <label className="form-label fw-semibold">
                      Phone Number
                    </label>
                    <br />
                    <input
                      type="text"
                      className="form-control mb-3"
                      rows="4"
                      placeholder="Enter your phone number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                    />
                    <label className="form-label fw-semibold">Address</label>
                    <br />
                    <textarea
                      type="text"
                      className="form-control mb-3"
                      rows="4"
                      placeholder="Enter your address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </>
                ) : (
                  <span></span>
                )}

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
            </div>
          </div>
        </div>
      </form>
      {/* Modal Change Password*/}
      <form onSubmit={changePW}>
        <div
          className="modal fade"
          id="changePasswordModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5 fw-semibold">
                  Change Password
                </h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>

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
            </div>
          </div>
        </div>
      </form>
      {/* Modal Delete Account */}
      <form onSubmit={deleteAccount}>
        <div
          className="modal fade"
          id="deleteAccountModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5 fw-semibold">Delete Account</h1>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body">
                <p>
                  Are you sure you want to delete your account? This action is
                  irreversible and will permanently remove all your data from
                  our system.
                </p>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-danger">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export default MyProfile;
