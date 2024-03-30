const express = require("express");
const multer = require("multer");
const { createCanvas, loadImage, registerFont } = require("canvas");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Multer configuration for handling file uploads
const upload = multer({ dest: "uploads/" });

// Use CORS middleware
app.use(cors());

const watermarkText = "Watermark text"; // Watermark text

// Register a font if needed
// registerFont('path/to/font.ttf', { family: 'FontName' });

// Function to calculate positions in a grid with some randomness
function calculateRandomGridPositions(width, height, numTexts, stretchFactor) {
  const positions = [];
  const cols = Math.ceil(Math.sqrt(numTexts));
  const rows = Math.ceil(numTexts / cols);
  const colSpacing = (width / (cols + 1)) * stretchFactor;
  const rowSpacing = (height / (rows + 1)) * stretchFactor;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = colSpacing * (i + 1) + (Math.random() - 0.5) * (colSpacing / 2);
      const y = rowSpacing * (j + 1) + (Math.random() - 0.5) * (rowSpacing / 2);
      positions.push({ x, y });
    }
  }

  return positions.slice(0, numTexts);
}

// Route for uploading image
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Load the uploaded image
    const image = await loadImage(req.file.path);

    // Create canvas
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    // Draw the uploaded image on the canvas
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // Apply multiple text watermarks
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Set text color with opacity
    ctx.font = "50px Arial"; // Set font size and family

    const stretchFactor = 1.5; // Stretch factor for the grid
    const positions = calculateRandomGridPositions(
      canvas.width,
      canvas.height,
      40,
      stretchFactor
    );

    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];

      ctx.textAlign = "center"; // Set text alignment
      ctx.fillText(watermarkText, x, y); // Draw text at the calculated position
    }

    // Convert canvas to a buffer
    const buffer = canvas.toBuffer();

    // Send the watermarked image as response
    res.set("Content-Type", "image/png");
    res.send(buffer);

    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
