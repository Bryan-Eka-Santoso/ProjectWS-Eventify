function EventStatusBadge({ status }) {
  const statusClass = {
    published: "bg-success",
    draft: "bg-warning text-dark",
    pending: "bg-warning text-dark",
    pending_approval: "bg-info text-dark",
    approved: "bg-success",
    rejected: "bg-danger",
    canceled: "bg-secondary",
    completed: "bg-primary",
    processing: "bg-info text-dark",
    refunded: "bg-success",
  };

  return (
    <span className={`badge px-3 py-2 rounded-pill ${statusClass[status] || "bg-dark"}`}>
      {String(status || "-").toUpperCase()}
    </span>
  );
}

export default EventStatusBadge;