import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to FinEdge API 🚀" });
});

app.listen(PORT, () => {
  console.log(`FinEdge API listening on port ${PORT}`);
});
