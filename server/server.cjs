const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("./routes/auth.cjs"));

app.listen(3005, () => {
  console.log("Server Berjalan Di Port 3005");
});
