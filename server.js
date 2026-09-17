const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve website files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "online" });
  });

  // Send homepage
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    // Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Human Life AI Ecosystem running on port ${PORT}`);
      });
      
