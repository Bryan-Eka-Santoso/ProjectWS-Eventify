const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ini akan mengarah ke server/public/uploads
    const dir = path.join(__dirname, "../public/uploads");

    // Codingan sakti: kalau folder belum ada, dibuatin otomatis!
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Menghasilkan angka acak 4 digit, misal: 4321-foto.jpg
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
module.exports = upload;
