import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const resend = new Resend(process.env.RESEND_API_KEY);

  app.use(express.json({ limit: '10mb' }));

  // API Route for sending emails
  app.post("/api/send-invoice", async (req, res) => {
    const { to, subject, html, attachments, businessName } = req.body;

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Resend API key missing on server" });
    }

    try {
      const data = await resend.emails.send({
        from: `${businessName || "BillaraAI"} <onboarding@resend.dev>`,
        to,
        subject,
        html,
        attachments: attachments || []
      });

      res.json(data);
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/send-reminder", async (req, res) => {
    const { to, subject, html, businessName } = req.body;

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Resend API key missing on server" });
    }

    try {
      const data = await resend.emails.send({
        from: `${businessName || "BillaraAI"} <reminders@resend.dev>`,
        to,
        subject,
        html,
      });

      res.json(data);
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to send reminder email" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
