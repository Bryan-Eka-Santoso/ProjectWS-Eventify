import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";

const API_BASE = "/transactions/admin/dashboard";

const STATUS_BADGE = {
  paid: "bg-success",
  pending: "bg-warning text-dark",
  expired: "bg-secondary",
  failed: "bg-danger",
};

const ROLE_BADGE = {
  admin: "bg-danger",
  organizer: "bg-info text-dark",
  user: "bg-secondary",
};

function HomeAdmin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    document.title = "Dashboard (Admin) | Eventify";

    const fetchStats = async () => {
      try {
        const res = await api.get(API_BASE);
        setStats(res.data.data);
      } catch (error) {
        console.error("Gagal mengambil statistik dashboard:", error);
        setErrorMessage(
          error.response?.data?.message || "Gagal memuat statistik dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatRupiahCompact = (amount) =>
    new Intl.NumberFormat("id-ID", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const weekdayLabel = (dateStr) =>
    new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "short",
    });

  const totals = stats?.totals || {};
  const attention = stats?.needs_attention || {};
  const revenueDays = stats?.revenue_last_7_days || [];
  const maxRevenue = Math.max(...revenueDays.map((d) => d.total), 0);

  const statCards = [
    {
      label: "Total Users",
      value: totals.users,
      icon: "bi-people",
      link: "/admin/users",
    },
    {
      label: "Total Events",
      value: totals.events,
      icon: "bi-calendar-check",
      link: "/admin/events",
    },
    {
      label: "Revenue (Paid)",
      value: formatRupiah(totals.revenue),
      icon: "bi-cash-stack",
      link: "/admin/transactions",
    },
    {
      label: "Tiket Terjual",
      value: totals.tickets_sold,
      icon: "bi-ticket-perforated",
      link: "/admin/transactions",
    },
  ];

  const secondaryCards = [
    {
      label: "Transaksi",
      value: totals.transactions,
      link: "/admin/transactions",
    },
    { label: "Posts", value: totals.posts, link: "/admin/posts" },
    {
      label: "Chat Rooms",
      value: totals.chat_rooms,
      link: "/admin/chat-rooms",
    },
    { label: "Vouchers", value: totals.vouchers, link: "/admin/discounts" },
  ];

  const attentionItems = [
    {
      label: "Event menunggu approval",
      count: attention.pending_events,
      link: "/admin/events",
    },
    {
      label: "Permintaan pembatalan event",
      count: attention.pending_cancellations,
      link: "/admin/cancellation-requests",
    },
    {
      label: "Refund sedang diproses",
      count: attention.active_refunds,
      link: "/admin/transactions",
    },
  ];

  const totalAttention = attentionItems.reduce(
    (sum, item) => sum + (item.count || 0),
    0,
  );

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">📊 Dashboard</h2>
            <p className="text-muted mb-0">
              Ringkasan aktivitas Eventify hari ini.
            </p>
          </div>
          <div className="text-muted small text-end d-none d-md-block">
            {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat statistik...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal">{errorMessage}</h5>
          </div>
        ) : (
          <>
            {/* STAT CARDS UTAMA */}
            <div className="row g-3 mb-3">
              {statCards.map((card) => (
                <div className="col-6 col-lg-3" key={card.label}>
                  <Link
                    to={card.link}
                    className="card border rounded-4 shadow-sm h-100 text-decoration-none text-dark"
                  >
                    <div className="card-body p-4 d-flex align-items-center gap-3">
                      <div
                        className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "48px", height: "48px" }}
                      >
                        <i className={`bi ${card.icon} fs-4`}></i>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="small text-muted">{card.label}</div>
                        <div className="fs-4 fw-bold text-truncate">
                          {card.value ?? 0}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* STAT CARDS SEKUNDER */}
            <div className="row g-3 mb-4">
              {secondaryCards.map((card) => (
                <div className="col-6 col-lg-3" key={card.label}>
                  <Link
                    to={card.link}
                    className="card border rounded-4 shadow-sm text-decoration-none text-dark"
                  >
                    <div className="card-body py-3 px-4 d-flex justify-content-between align-items-center">
                      <span className="small text-muted">{card.label}</span>
                      <span className="fw-bold">{card.value ?? 0}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <div className="row g-3 mb-4">
              {/* OMZET 7 HARI TERAKHIR */}
              <div className="col-lg-8">
                <div className="card border rounded-4 shadow-sm h-100">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-1">Omzet 7 Hari Terakhir</h5>
                    <p className="text-muted small mb-4">
                      Total pembayaran berstatus paid per hari.
                    </p>

                    {maxRevenue === 0 ? (
                      <div className="text-center py-4 bg-light rounded-3">
                        <p className="text-muted mb-0">
                          Belum ada omzet dalam 7 hari terakhir.
                        </p>
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-end justify-content-between gap-2"
                        style={{ height: "160px" }}
                      >
                        {revenueDays.map((day) => {
                          const heightPct =
                            maxRevenue > 0 ? (day.total / maxRevenue) * 100 : 0;
                          const isMax =
                            day.total === maxRevenue && day.total > 0;
                          return (
                            <div
                              key={day.date}
                              className="d-flex flex-column align-items-center flex-grow-1 h-100 justify-content-end"
                              title={`${weekdayLabel(day.date)} (${day.date}): ${formatRupiah(day.total)}`}
                            >
                              {isMax && (
                                <div className="small fw-semibold text-dark mb-1">
                                  {formatRupiahCompact(day.total)}
                                </div>
                              )}
                              <div
                                className="w-100 bg-primary"
                                style={{
                                  height: `${Math.max(heightPct, day.total > 0 ? 4 : 1)}%`,
                                  maxWidth: "48px",
                                  borderRadius: "4px 4px 0 0",
                                  minHeight: day.total > 0 ? "6px" : "2px",
                                  opacity: day.total > 0 ? 1 : 0.15,
                                }}
                              ></div>
                              <div className="small text-muted mt-2">
                                {weekdayLabel(day.date)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PERLU PERHATIAN */}
              <div className="col-lg-4">
                <div className="card border rounded-4 shadow-sm h-100">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-1">
                      Perlu Perhatian{" "}
                      {totalAttention > 0 && (
                        <span className="badge bg-warning text-dark ms-1">
                          {totalAttention}
                        </span>
                      )}
                    </h5>
                    <p className="text-muted small mb-3">
                      Item yang menunggu tindakan admin.
                    </p>

                    <div className="d-flex flex-column gap-2">
                      {attentionItems.map((item) => (
                        <Link
                          key={item.label}
                          to={item.link}
                          className={`d-flex justify-content-between align-items-center p-3 rounded-3 border text-decoration-none ${
                            item.count > 0
                              ? "bg-warning bg-opacity-10 border-warning"
                              : "bg-light"
                          }`}
                        >
                          <span
                            className={`small ${
                              item.count > 0
                                ? "fw-semibold text-dark"
                                : "text-muted"
                            }`}
                          >
                            {item.count > 0 && (
                              <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                            )}
                            {item.label}
                          </span>
                          <span
                            className={`badge ${
                              item.count > 0
                                ? "bg-warning text-dark"
                                : "bg-secondary"
                            }`}
                          >
                            {item.count ?? 0}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3">
              {/* TRANSAKSI TERBARU */}
              <div className="col-lg-7">
                <div className="card border rounded-4 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Transaksi Terbaru</h5>
                      <Link
                        to="/admin/transactions"
                        className="small text-decoration-none"
                      >
                        Lihat Semua →
                      </Link>
                    </div>

                    {(stats?.recent_transactions || []).length === 0 ? (
                      <p className="text-muted text-center py-4 mb-0">
                        Belum ada transaksi.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>User</th>
                              <th>Event</th>
                              <th className="text-end">Total</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recent_transactions.map((tx) => (
                              <tr key={tx.id}>
                                <td className="fw-semibold">
                                  {tx.User?.name || "—"}
                                </td>
                                <td className="text-muted small">
                                  {tx.Details?.[0]?.TicketType?.Event?.title ||
                                    "—"}
                                </td>
                                <td className="text-end fw-semibold">
                                  {formatRupiah(tx.final_amount)}
                                </td>
                                <td>
                                  <span
                                    className={`badge text-uppercase ${
                                      STATUS_BADGE[tx.payment_status] ||
                                      "bg-secondary"
                                    }`}
                                  >
                                    {tx.payment_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* USER BARU */}
              <div className="col-lg-5">
                <div className="card border rounded-4 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">User Baru</h5>
                      <Link
                        to="/admin/users"
                        className="small text-decoration-none"
                      >
                        Lihat Semua →
                      </Link>
                    </div>

                    {(stats?.recent_users || []).length === 0 ? (
                      <p className="text-muted text-center py-4 mb-0">
                        Belum ada user.
                      </p>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {stats.recent_users.map((user) => (
                          <div
                            key={user.id}
                            className="d-flex align-items-center gap-3 p-2 rounded-3 border bg-light"
                          >
                            <i className="bi bi-person-circle fs-3 text-secondary"></i>
                            <div
                              className="flex-grow-1"
                              style={{ minWidth: 0 }}
                            >
                              <div className="fw-semibold text-truncate">
                                {user.name}
                              </div>
                              <div className="small text-muted text-truncate">
                                {user.email} · {formatDate(user.created_at)}
                              </div>
                            </div>
                            <span
                              className={`badge text-uppercase ${
                                ROLE_BADGE[user.role] || "bg-secondary"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}

export default HomeAdmin;
