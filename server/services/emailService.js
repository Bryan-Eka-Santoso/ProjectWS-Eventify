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

module.exports = {
  sendMail,
  sendEventCanceledEmail,
  sendEventChangedEmail,
  sendRefundSuccessEmail,
};