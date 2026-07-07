import React, { useState } from "react";
import axios from "axios";
import { AUTH_USER } from "../config/auth";

function CancelEventModal({ event, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancelEvent = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      alert("Alasan pembatalan minimal 5 karakter.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.patch(
        `http://localhost:5000/api/events/${event.id}/cancel`,
        {
          user_id: AUTH_USER.id,
          role: AUTH_USER.role,
          cancellation_reason: reason,
        }
      );

      alert(res.data.message);

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Gagal membatalkan event:", error);
      alert(error.response?.data?.message || "Gagal membatalkan event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>

      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header bg-danger text-white rounded-top-4">
              <h5 className="modal-title fw-bold">Batalkan Event</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              <p className="mb-2">
                Kamu akan membatalkan event:
                <br />
                <strong>{event?.title}</strong>
              </p>

              <div className="alert alert-warning small">
                Jika event sudah kurang dari H-4 dan kamu organizer, sistem akan
                membuat request pembatalan ke admin terlebih dahulu.
              </div>

              <label className="form-label fw-semibold">
                Alasan Pembatalan
              </label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Contoh: Event dibatalkan karena kendala teknis..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              ></textarea>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light border"
                onClick={onClose}
                disabled={loading}
              >
                Tutup
              </button>

              <button
                type="button"
                className="btn btn-danger fw-bold"
                onClick={handleCancelEvent}
                disabled={loading}
              >
                {loading ? "Memproses..." : "Ya, Batalkan Event"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CancelEventModal;