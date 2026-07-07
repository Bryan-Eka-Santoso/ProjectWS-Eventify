function EventStatusBadge({ status }) {
  const statusClass = {
    published: "bg-success",
    draft: "bg-warning text-dark",
    pending_approval: "bg-info text-dark",
    rejected: "bg-danger",
    canceled: "bg-secondary",
    completed: "bg-primary",
  };

  return (
    <span className={`badge px-3 py-2 rounded-pill ${statusClass[status] || "bg-dark"}`}>
      {String(status || "-").toUpperCase()}
    </span>
  );
}

export default EventStatusBadge;