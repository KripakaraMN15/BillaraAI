

# BillaraAI

BillaraAI is a full-stack, AI-powered invoicing and client management application designed to simplify the billing process for freelancers and small businesses.

## Features

- **Authentication:** Secure user login and profile management using Firebase.
- **Invoice Management:** Create, edit, and track invoices with support for itemized billing and PDF generation.
- **Client Dashboard:** A dedicated space to track total earnings and manage client records.
- **Email Integration:** Send invoices and reminders directly to clients using the Resend API.
- **AI Capabilities:** Integrated with Google Gemini for advanced data extraction and automated drafting.
- **Secure Access:** Strict Firestore security rules to protect user data and ensure privacy for public-facing invoices.

## Tech Stack

- **Frontend:** React 19, React Router v7, Tailwind CSS v4, Framer Motion
- **Backend:** Express.js (serving API endpoints and Vite in development mode)
- **Database & Auth:** Firebase / Firestore
- **Integrations:** Resend (Email), Google Gemini (AI)

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Setup:
   Create a `.env` or `.env.local` file in the root directory based on `.env.example` and fill in your keys:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `RESEND_API_KEY`: Your Resend API key for emailing.

3. Run the application:
   ```bash
   npm run dev
   ```

The application will be running locally.
