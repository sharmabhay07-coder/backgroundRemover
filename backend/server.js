const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/remove-bg", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    const formData = new FormData();
    formData.append("image_file", fs.createReadStream(imagePath));
    formData.append("size", "auto");

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "X-Api-Key": process.env.REMOVE_BG_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    const outputPath = `edited-${Date.now()}.png`;
    fs.writeFileSync(outputPath, response.data);

    res.setHeader("Content-Type", "image/png");
    res.sendFile(__dirname + "/" + outputPath);

  } catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).send("Error removing background");
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});