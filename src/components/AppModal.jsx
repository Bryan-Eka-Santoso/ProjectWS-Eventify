import React from "react";

function AppModal({
  show,
  title = "Informasi",
  message = "",
  type = "info",
  confirmText = "OK",
  cancelText = "Batal",
  showCancel = false,
  onConfirm,
  onClose,
}) {
  if (!show) return null;

  const typeConfig = {
    success: {
      headerClass: "bg-success text-white",
      icon: "✅",
    },
    error: {
      headerClass: "bg-danger text-white",
      icon: "❌",
    },
    warning: {
      headerClass: "bg-warning text-dark",
      icon: "⚠️",
    },
    confirm: {
      headerClass: "bg-primary text-white",
      icon: "❓",
    },
    info: {
      headerClass: "bg-primary text-white",
      icon: "ℹ️",
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 2000 }}></div>

      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 2010 }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content border-0 rounded-4 shadow-lg">
            <div className={`modal-header ${config.headerClass} rounded-top-4`}>
              <h5 className="modal-title fw-bold mb-0">
                {config.icon} {title}
              </h5>
              <button
                type="button"
                className={`btn-close ${
                  type === "warning" ? "" : "btn-close-white"
                }`}
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body p-4">
              <p className="mb-0" style={{ whiteSpace: "pre-line" }}>
                {message}
              </p>
            </div>

            <div className="modal-footer bg-light rounded-bottom-4">
              {showCancel && (
                <button
                  type="button"
                  className="btn btn-light border fw-semibold"
                  onClick={onClose}
                >
                  {cancelText}
                </button>
              )}

              <button
                type="button"
                className={`btn fw-bold ${
                  type === "error"
                    ? "btn-danger"
                    : type === "warning"
                      ? "btn-warning"
                      : type === "success"
                        ? "btn-success"
                        : "btn-primary"
                }`}
                onClick={handleConfirm}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AppModal;
