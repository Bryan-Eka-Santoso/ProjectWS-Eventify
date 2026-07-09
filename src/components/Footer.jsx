import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-light text-dark pt-5 pb-3 border-top">
      <div className="container">
        <div className="row gy-4">
          {/* Brand */}
          <div className="col-lg-5">
            <h3 className="fw-bold mb-3">Eventify</h3>
            <p className="text-secondary mb-0">
              Discover exciting events, connect with communities, and create
              unforgettable experiences all in one platform.
            </p>
          </div>

          {/* Navigation */}
          <div className="col-lg-3 col-md-6">
            <h5 className="fw-semibold mb-3">Navigation</h5>

            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/explore" className="text-decoration-none text-dark">
                  Explore Events
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/community"
                  className="text-decoration-none text-dark"
                >
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-4 col-md-6">
            <h5 className="fw-semibold mb-3">Contact</h5>

            <p className="mb-2 text-secondary">📧 support@eventify.com</p>

            <p className="mb-2 text-secondary">📍 Surabaya, Indonesia</p>

            <div className="d-flex gap-3 mt-3 fs-4">
              <a href="#" className="text-dark">
                <i className="bi bi-instagram"></i>
              </a>

              <a href="#" className="text-dark">
                <i className="bi bi-twitter-x"></i>
              </a>

              <a href="#" className="text-dark">
                <i className="bi bi-facebook"></i>
              </a>

              <a href="#" className="text-dark">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>
        </div>

        <hr />

        <div className="text-center">
          <small className="text-secondary">
            © {new Date().getFullYear()} Eventify. All Rights Reserved.
          </small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
