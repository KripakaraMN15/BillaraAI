<div align="center">

# 🧾 BillaraAI

**AI-powered invoicing and client management for freelancers and small businesses.**

Turn a text or audio brief into a polished invoice in under 3 seconds — cutting invoice creation time by ~85%.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://billaraai-166180432228.asia-southeast1.run.app/)
[![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](#)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](#)

</div>

---

## 🔗 Live App

**[billaraai-166180432228.asia-southeast1.run.app](https://billaraai-166180432228.asia-southeast1.run.app/)**

## 🖥️ Overview

BillaraAI is a full-stack, AI-powered invoicing and client management application designed to simplify the billing process for freelancers and small businesses. Instead of manually filling out line items, BillaraAI reads a short text or audio brief and drafts a structured, itemized invoice automatically — turning a task that normally takes minutes into a matter of seconds.

## ✨ Features

- 🔐 **Authentication** — Secure user login and profile management using Firebase Auth.
- 🧾 **Invoice Management** — Create, edit, and track invoices with itemized billing and PDF export.
- 📊 **Client Dashboard** — A dedicated space to track total earnings and manage client records in real time.
- 📧 **Email Integration** — Send invoices and payment reminders directly to clients via the Resend API.
- 🤖 **AI-Powered Drafting** — Google Gemini converts unstructured text/audio briefs into structured, itemized invoice data using JSON extraction, cutting invoice creation time by ~85%.
- ⏰ **Penalty Calculation** — Automated late-payment penalty logic built into the invoice lifecycle.
- 🔒 **Secure by Design** — Server-side API proxying keeps AI/API keys off the client, strict Firestore RBAC rules govern data access, and rate limiting protects both the backend and public-facing invoice links from abuse.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router v7, Tailwind CSS v4, Framer Motion |
| **Backend** | Express.js (API endpoints; Vite in development mode) |
| **Database & Auth** | Firebase / Firestore |
| **AI** | Google Gemini (structured JSON extraction & drafting) |
| **Email** | Resend API |

## 🏗️ Architecture Notes

- **Server-side API proxying** — all calls to Gemini and Resend are routed through the Express backend, so API keys are never exposed to the client.
- **Firestore security rules** — enforce per-user data isolation while still allowing safe, scoped read access for public-facing invoice links (e.g., a client viewing their own invoice without an account).
- **Rate limiting** — applied at the API layer to protect against abuse on both authenticated and public endpoints.

## 🚀 Run Locally

**Prerequisites:** Node.js

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd billaraai
   npm install
   ```

2. **Environment setup**

   Create a `.env` or `.env.local` file in the root directory based on `.env.example` and fill in your keys:

   | Variable | Description |
   |---|---|
   | `GEMINI_API_KEY` | Your Google Gemini API key |
   | `RESEND_API_KEY` | Your Resend API key for emailing |

3. **Run the app**
   ```bash
   npm run dev
   ```

   The application will be running locally.


---

<div align="center">

Built by [Kripakara M. N.](https://github.com/KripakaraMN15) · [LinkedIn](https://linkedin.com/in/kripakaramn)

</div>
