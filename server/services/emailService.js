const nodemailer = require("nodemailer");

const isEmailConfigured = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("SMTP belum dikonfigurasi. Email tidak dikirim.");
    return {
      skipped: true,
      reason: "SMTP belum dikonfigurasi",
    };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
};

const sendEventCanceledEmail = async ({ to, name, event }) => {
  return await sendMail({
    to,
    subject: `Event dibatalkan: ${event.title}`,
    text: `Halo ${name}, event ${event.title} telah dibatalkan. Refund akan diproses secara otomatis.`,
    html: `
      <h2>Event Dibatalkan</h2>
      <p>Halo ${name},</p>
      <p>Event <strong>${event.title}</strong> telah dibatalkan.</p>
      <p>Refund akan diproses secara otomatis oleh sistem.</p>
      <p><strong>Lokasi:</strong> ${event.location}</p>
      <p><strong>Tanggal Mulai:</strong> ${event.start_date}</p>
    `,
  });
};

const sendEventChangedEmail = async ({ to, name, event, eventChange }) => {
  return await sendMail({
    to,
    subject: `Perubahan event: ${event.title}`,
    text: `Halo ${name}, event ${event.title} mengalami perubahan jadwal atau lokasi. Kamu dapat mengajukan refund sebelum ${eventChange.refund_deadline}.`,
    html: `
      <h2>Informasi Event Berubah</h2>
      <p>Halo ${name},</p>
      <p>Event <strong>${event.title}</strong> mengalami perubahan jadwal atau lokasi.</p>

      <h3>Detail Perubahan</h3>
      <p><strong>Jadwal lama:</strong> ${eventChange.old_start_date || "-"}</p>
      <p><strong>Jadwal baru:</strong> ${eventChange.new_start_date || "-"}</p>
      <p><strong>Lokasi lama:</strong> ${eventChange.old_location || "-"}</p>
      <p><strong>Lokasi baru:</strong> ${eventChange.new_location || "-"}</p>

      <p>Kamu dapat mengajukan refund sebelum:</p>
      <p><strong>${eventChange.refund_deadline}</strong></p>
    `,
  });
};

const sendRefundSuccessEmail = async ({ to, name, refund }) => {
  return await sendMail({
    to,
    subject: "Refund berhasil diproses",
    text: `Halo ${name}, refund kamu sebesar ${refund.amount} telah berhasil diproses.`,
    html: `
      <h2>Refund Berhasil</h2>
      <p>Halo ${name},</p>
      <p>Refund kamu telah berhasil diproses.</p>
      <p><strong>Jumlah refund:</strong> Rp${refund.amount}</p>
      <p><strong>Status:</strong> ${refund.status}</p>
    `,
  });
};

const sendRefundRequestEmailToAdmin = async ({ to, adminName, buyer, event, refund }) => {
  return await sendMail({
    to,
    subject: `Pengajuan refund baru: ${event.title}`,
    text: `Halo ${adminName}, ada pengajuan refund baru dari ${buyer.name} untuk event ${event.title}.`,
    html: `
      <h2>Pengajuan Refund Baru</h2>
      <p>Halo ${adminName || "Admin"},</p>
      <p>Ada pengajuan refund baru dari pembeli.</p>

      <h3>Detail Refund</h3>
      <p><strong>Nama pembeli:</strong> ${buyer.name}</p>
      <p><strong>Email pembeli:</strong> ${buyer.email}</p>
      <p><strong>Event:</strong> ${event.title}</p>
      <p><strong>Jumlah refund:</strong> Rp${Number(refund.amount || 0).toLocaleString("id-ID")}</p>
      <p><strong>Status:</strong> ${refund.status}</p>
      <p><strong>Alasan:</strong> ${refund.reason || "-"}</p>

      <p>Silakan buka dashboard admin untuk approve atau reject refund ini.</p>
    `,
  });
};

const sendRefundRejectedEmail = async ({ to, name, refund }) => {
  return await sendMail({
    to,
    subject: "Pengajuan refund ditolak",
    text: `Halo ${name}, pengajuan refund kamu ditolak. Alasan: ${refund.rejection_reason || "-"}`,
    html: `
      <h2>Refund Ditolak</h2>
      <p>Halo ${name || "User"},</p>
      <p>Pengajuan refund kamu telah ditolak oleh admin.</p>

      <h3>Detail Refund</h3>
      <p><strong>Jumlah refund:</strong> Rp${Number(refund.amount || 0).toLocaleString("id-ID")}</p>
      <p><strong>Status:</strong> ${refund.status}</p>
      <p><strong>Alasan penolakan:</strong> ${refund.rejection_reason || "-"}</p>
    `,
  });
};

const sendCancellationRequestEmailToAdmin = async ({
  to,
  adminName,
  organizer,
  event,
  cancellationRequest,
}) => {
  return await sendMail({
    to,
    subject: `Request pembatalan event: ${event.title}`,
    text: `Halo ${adminName}, organizer ${organizer.name} mengajukan pembatalan event ${event.title}.`,
    html: `
      <h2>Request Pembatalan Event</h2>
      <p>Halo ${adminName || "Admin"},</p>
      <p>Organizer mengajukan pembatalan event dan membutuhkan persetujuan admin.</p>

      <h3>Detail Event</h3>
      <p><strong>Event:</strong> ${event.title}</p>
      <p><strong>Organizer:</strong> ${organizer.name}</p>
      <p><strong>Lokasi:</strong> ${event.location}</p>
      <p><strong>Tanggal Mulai:</strong> ${event.start_date}</p>

      <h3>Alasan Pembatalan</h3>
      <p>${cancellationRequest.reason || "-"}</p>

      <p>Silakan buka dashboard admin untuk approve atau reject request ini.</p>
    `,
  });
};

const sendCancellationApprovedEmailToOrganizer = async ({ to, name, event }) => {
  return await sendMail({
    to,
    subject: `Pembatalan event disetujui: ${event.title}`,
    text: `Halo ${name}, request pembatalan event ${event.title} telah disetujui admin.`,
    html: `
      <h2>Pembatalan Event Disetujui</h2>
      <p>Halo ${name || "Organizer"},</p>
      <p>Request pembatalan event <strong>${event.title}</strong> telah disetujui oleh admin.</p>
      <p>Status event sudah berubah menjadi canceled dan pembeli akan mendapatkan informasi pembatalan.</p>
    `,
  });
};

const sendCancellationRejectedEmailToOrganizer = async ({
  to,
  name,
  event,
  adminNote,
}) => {
  return await sendMail({
    to,
    subject: `Pembatalan event ditolak: ${event.title}`,
    text: `Halo ${name}, request pembatalan event ${event.title} ditolak admin.`,
    html: `
      <h2>Pembatalan Event Ditolak</h2>
      <p>Halo ${name || "Organizer"},</p>
      <p>Request pembatalan event <strong>${event.title}</strong> ditolak oleh admin.</p>

      <p><strong>Catatan admin:</strong></p>
      <p>${adminNote || "-"}</p>
    `,
  });
};

const sendTicketPurchaseSuccessEmail = async ({ to, name, event, transaction, tickets = [] }) => {
  const ticketListHtml = tickets
    .map(
      (ticket) => `
        <li>
          <strong>${ticket.ticket_code}</strong> - ${ticket.TicketType?.name || "Ticket"}
        </li>
      `
    )
    .join("");

  return await sendMail({
    to,
    subject: `Pembelian ticket berhasil: ${event.title}`,
    text: `Halo ${name}, pembelian ticket untuk event ${event.title} berhasil.`,
    html: `
      <h2>Pembelian Ticket Berhasil</h2>
      <p>Halo ${name || "User"},</p>
      <p>Pembelian ticket untuk event <strong>${event.title}</strong> berhasil.</p>

      <h3>Detail Transaksi</h3>
      <p><strong>Transaction ID:</strong> ${transaction.id}</p>
      <p><strong>Total:</strong> Rp${Number(transaction.final_amount || 0).toLocaleString("id-ID")}</p>
      <p><strong>Status:</strong> ${transaction.payment_status}</p>

      <h3>Ticket Kamu</h3>
      <ul>
        ${ticketListHtml || "<li>Ticket berhasil dibuat.</li>"}
      </ul>

      <p>Simpan kode ticket ini untuk validasi saat event berlangsung.</p>
    `,
  });
};

module.exports = {
  sendMail,
  sendEventCanceledEmail,
  sendEventChangedEmail,
  sendRefundSuccessEmail,
  sendRefundRequestEmailToAdmin,
  sendRefundRejectedEmail,
  sendCancellationRequestEmailToAdmin,
  sendCancellationApprovedEmailToOrganizer,
  sendCancellationRejectedEmailToOrganizer,
  sendTicketPurchaseSuccessEmail,
};