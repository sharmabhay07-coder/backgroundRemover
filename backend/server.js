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
      "https://api.slazzer.com/v2.0/remove_image_background",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": process.env.REMOVE_BG_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );
    // console.log("API KEY:", process.env.REMOVE_BG_API_KEY);

    const outputPath = `edited-${Date.now()}.png`;
    fs.writeFileSync(outputPath, response.data);

    res.setHeader("Content-Type", "image/png");
    res.sendFile(__dirname + "/" + outputPath);

  } catch (error) {
    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log("DATA:", error.response.data.toString());
    } else {
      console.log("ERROR:", error.message);
    }

    res.status(500).send("Error removing background");
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});