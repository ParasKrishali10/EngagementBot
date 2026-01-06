import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express();

app.get("/", (_req, res) => {
  res.send("Bot is alive 🚀");
});

// Create ONE HTTP server
const server = http.createServer(app);

// Attach WebSocket to SAME server
export const wss = new WebSocketServer({ server });

// Broadcast helper
export function broadcast(data: any) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("HTTP + WebSocket running on port", PORT);
});
