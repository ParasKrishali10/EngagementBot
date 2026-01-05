import express from "express";

const app = express();

app.get("/", (req:any, res:any) => {
  res.send("Bot is alive 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Keep-alive server running on port", PORT);
});
