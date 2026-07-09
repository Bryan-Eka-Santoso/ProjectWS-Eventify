import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { AUTH_USER } from "../config/auth";

const API_BASE = `http://localhost:5000/api/transactions`;

function PointHistory() {
  const [histories, setHistories] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Point History | Eventify";

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/points/history`, {
          params: { user_id: AUTH_USER.id },
        });
        setHistories(res.data.data?.histories || []);
        setCurrentPoints(res.data.data?.current_points || 0);
      } catch (error) {
        console.error("Gagal mengambil riwayat poin:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <>
      <Navbar />

      <div
        className="container mt-5 mb-5"
        style={{ minHeight: "75vh", maxWidth: "720px" }}
      >
        <Link
          to="/profile"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke Profile
        </Link>

        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">🪙 Point History</h2>
            <p className="text-muted mb-0">
              Riwayat perolehan dan pemakaian poin kamu.
            </p>
          </div>

          <div className="text-end">
            <div className="small text-muted">Saldo Poin</div>
            <div className="fs-3 fw-bold text-primary">{currentPoints} pts</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat riwayat poin...</p>
          </div>
        ) : histories.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-2">
              Belum ada riwayat poin.
            </h5>
            <p className="small text-muted mb-0">
              Beli tiket event untuk mengumpulkan poin, lalu tukarkan dengan
              voucher menarik!
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {histories.map((h) => (
              <div key={h.id} className="card border rounded-4 shadow-sm">
                <div className="card-body p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <span
                      className={`badge rounded-pill fs-6 ${
                        h.type === "earn" ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {h.type === "earn" ? "＋" : "－"}
                    </span>
                    <div>
                      <div className="fw-semibold">
                        {h.description ||
                          (h.type === "earn"
                            ? "Perolehan poin"
                            : "Pemakaian poin")}
                      </div>
                      <div className="small text-muted">
                        {formatDate(h.created_at)}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`fw-bold fs-5 ${
                      h.type === "earn" ? "text-success" : "text-danger"
                    }`}
                  >
                    {h.type === "earn" ? "+" : "-"}
                    {h.amount} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default PointHistory;
