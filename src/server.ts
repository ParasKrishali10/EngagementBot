import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import "./bot";

const app = express();

app.get("/", (_req, res) => {
  res.send("Bot is alive 🚀");
});

// ONE server
const server = http.createServer(app);

// Attach WS to same server
export const wss = new WebSocketServer({ server });

export function broadcast(data: any) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("HTTP + WebSocket running on port", PORT);
});
