<div align="center">

# 🏆 Community Hero
### AI-Powered Hyperlocal Civic Issue Reporting & Resolution Platform

![Community Hero Hackathon 2026](https://img.shields.io/badge/Community_Hero_Hackathon-2026-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Organized by Coding Ninjas](https://img.shields.io/badge/Organized_by-Coding_Ninjas-FF6B6B?style=for-the-badge)
![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Neon](https://img.shields.io/badge/Neon_Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white)
![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

Built for the **Google Community Hero Hackathon**, organized by **Coding Ninjas**, leveraging **Google Gemini**, **Neon Postgres**, **Firebase Authentication**, and **Vercel** to build an AI-powered civic issue resolution platform.

[Live Demo](https://community-hero-lake.vercel.app/)

</div>

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Hackathon Requirements (Judges' Guide)](#-hackathon-requirements-judges-guide)
- [Key Features](#-key-features)
- [Google Technologies Utilized](#-google-technologies-utilized)
- [Tech Stack](#️-tech-stack)
- [System Architecture](#️-system-architecture)
- [Application Flow](#-application-flow)
- [Screenshots](#-screenshots)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Acknowledgements](#-acknowledgements)
- [Contact](#-contact)

---

## 🌍 Project Overview

### The Problem
Traditional civic reporting systems are broken: manual routing, subjective prioritization, bureaucratic bottlenecks, and "black-hole" feedback loops where citizens never hear back about their complaints. This leads to frustrated citizens, wasted municipal resources, and deteriorating infrastructure.

### The Community Hero Solution
**Community Hero** is an AI-powered civic issue management platform that enables citizens to report local infrastructure problems using images. Google Gemini automatically classifies issues, estimates severity, and assists authorities by verifying repair evidence through before-and-after image comparison — bringing transparency, speed, and intelligence to civic issue resolution.

---

## 🏆 Hackathon Requirements (Judges' Guide)

<details open>
<summary><b>Click to expand Hackathon Details</b></summary>

| Criteria | Implementation in Community Hero |
| :--- | :--- |
| **Problem Statement** | Community Hero – Hyperlocal Problem Solver. Empowers citizens to instantly report and track local civic issues while equipping authorities with an AI-assisted review and verification dashboard. |
| **Theme Alignment** | AI for Smart Cities. Integrates Gemini directly into the civic issue lifecycle — from detection to repair verification — to create transparent, self-organizing urban maintenance workflows. |
| **Solution Overview** | An end-to-end platform bridging citizens and authorities via AI-powered classification, severity estimation, duplicate detection, community validation, and repair verification. |
| **Impact & Community Benefits** | Reduces issue triage time from days to seconds. Promotes civic engagement through real-time tracking and community validation. Helps authorities detect fraudulent repair claims. |
| **Innovation & AI Capabilities** | Multimodal image-based issue detection, AI-driven severity scoring, smart duplicate merging within a 100m radius, and AI-powered before/after repair verification with re-verification workflows. |

</details>

---

## ✨ Key Features

### 🤖 AI & Automation
- **AI Issue Detection** — Google Gemini automatically detects civic issues from uploaded images, identifying type (Pothole, Garbage, Streetlight, Water Logging, Sewage) and estimating severity (Low, Medium, High, Severe).
- **AI Repair Verification** — Compares before-and-after images to verify completed repairs and flag potentially fraudulent submissions.
- **Re-Verification Workflow** — Disputed repairs can be resubmitted with new evidence for another round of AI verification.
- **Smart Duplicate Detection** — Automatically merges reports within a 100m radius to prevent duplicate complaints and spam.

### 🏙️ Civic & Authority Tools
- **Community Validation** — Citizens can confirm they're affected by an issue; higher validation increases its priority.
- **Interactive Issue Map** — Live emoji markers (🕳️🗑️💡💧🤢) with marker size scaling dynamically by affected citizen count.
- **Citizen Dashboard** — Nearby issues, live statistics, filtering & sorting, and an interactive map view.
- **Authority Dashboard** — Incident management, AI insights, fraud detection, and repair verification in one place.
- **Real-Time-Feel Sync** — Client-side polling / revalidation keeps dashboards fresh against the Neon Postgres backend.

### 🎨 UI / UX
- **Responsive Design** — Consistent experience across mobile, tablet, and desktop.
- **Role-Based Access** — Separate, tailored experiences for Citizens and Authorities.

---

## ⚡ Google Technologies Utilized

| Technology | Purpose in Community Hero |
| :--- | :--- |
| **Gemini API** | The core brain — multimodal image analysis for issue detection, severity scoring, and before/after repair verification. |
| **Firebase Authentication** | Secure, role-based authentication for citizens and authorities. |
| **Google AI Studio** | Used to prototype and validate Gemini prompts and structured JSON output schemas before backend integration. |

> **Note:** Data storage has migrated from Firebase Firestore to **Neon Postgres**. Firebase is now used exclusively for **Authentication**.

---

## 🛠️ Tech Stack

### 🎨 Frontend
- ![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white) **Next.js 16 (App Router)**
- ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB) **React**
- ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white) **TypeScript**
- ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white) **Tailwind CSS**

### ⚙️ Backend
- **Next.js API Routes** — Serverless functions for analysis, reporting, and verification endpoints.

### 🗄️ Database
- ![Neon](https://img.shields.io/badge/Neon-00E599?style=flat&logo=postgresql&logoColor=white) **Neon (Serverless Postgres)** — Primary datastore for reports, statuses, validations, and repair records.
- **ORM / Query layer** — e.g. Prisma or `@neondatabase/serverless` for querying Neon from Next.js API routes.

### 🔐 Authentication
- ![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=flat&logo=firebase&logoColor=black) **Firebase Authentication** — Secure sign-in/sign-up and role-based session management for Citizens and Authorities.

### 🤖 Artificial Intelligence
- **Google Gemini Flash** — Issue detection, severity scoring, repair verification.

### 🖼️ Image Storage
- ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white) **Cloudinary**

### 🗺️ Maps
- **Leaflet** & **OpenStreetMap**

### ☁️ Deployment
- ![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?style=flat&logo=vercel&logoColor=white) **Vercel** — Hosting for the Next.js app (frontend + API routes).

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Entities
    Citizen((🧑‍🤝‍🧑 Citizen))
    Authority((🏛️ Authority))

    %% Frontend
    subgraph Frontend [Client - Next.js / React, hosted on Vercel]
        WebUI[Web App UI]
        Map[Interactive Issue Map - Leaflet]
    end

    %% Backend
    subgraph Backend [Next.js API Routes on Vercel]
        AuthAPI[Auth Middleware]
        ReportAPI[Report API]
        AnalyzeAPI[Analyze API]
        VerifyAPI[Verify Repair API]
    end

    %% Google / External Services
    subgraph Services [AI, Auth & Media Services]
        Gemini[🤖 Gemini Flash API]
        FirebaseAuth[🔐 Firebase Authentication]
        Cloudinary[🖼️ Cloudinary]
    end

    %% Database
    subgraph Database [Storage]
        Neon[(🐘 Neon Postgres)]
    end

    %% Flow
    Citizen -->|Sign In| FirebaseAuth
    FirebaseAuth -->|Auth Token| WebUI
    Citizen -->|Uploads Image + Location| WebUI
    WebUI -->|REST Call| AnalyzeAPI
    AnalyzeAPI <-->|Image Analysis| Gemini
    AnalyzeAPI --> ReportAPI
    ReportAPI --> AuthAPI
    ReportAPI <--> Neon
    WebUI <-->|Image Upload| Cloudinary
    Map <-->|Query Data| Neon

    Neon -->|Updates| Authority
    Authority -->|Review / Repair Upload| VerifyAPI
    VerifyAPI <-->|Before/After Comparison| Gemini
    VerifyAPI --> Neon
```

---

## 🔄 Application Flow

```mermaid
flowchart LR
    A([📱 Citizen Reports Issue]) --> B{📸 Uploads Image & Location}
    B --> C[🧠 Gemini Analyzes Issue]
    C -->|Type + Severity Generated| D[(Report Saved to Neon Postgres)]
    D --> E[🗺️ Map & Dashboard Update]
    E --> F[👥 Community Validation]
    F --> G[🏛️ Authority Reviews Report]
    G --> H[🛠️ Repair Image Uploaded]
    H --> I[🧠 Gemini Compares Before & After]
    I -->|Verified| J([✅ Status: Resolved])
    I -->|Disputed| K([🔄 Needs Re-Verification])

    style A fill:#4285F4,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#8E75B2,stroke:#fff,stroke-width:2px,color:#fff
    style I fill:#8E75B2,stroke:#fff,stroke-width:2px,color:#fff
    style J fill:#34A853,stroke:#fff,stroke-width:2px,color:#fff
```

---

## 📸 Screenshots

| Landing Page | Citizen Dashboard |
| :---: | :---: |
| ![Landing Page](public/screenshots/landing-page.png) | ![Citizen Dashboard](public/screenshots/citizen-dashboard.png) |
| **AI Issue Detection & Report Review** | **AI Repair Verification** |
| ![AI Issue Detection](public/screenshots/authority-review.png) | ![AI Repair Verification](public/screenshots/ai-repair-detection.png) |
| **Authority Dashboard** | |
| ![Authority Dashboard](public/screenshots/authority-dashboard.png) | |

> *Gemini analyzes reported civic issues, classifies severity, and assists authorities during the review and repair-verification process.*

---

## 📂 Repository Structure

```text
community-hero/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   ├── report/
│   │   │   └── verify-repair/
│   │   ├── authority/
│   │   ├── dashboard/
│   │   ├── report/
│   │   ├── all-reports/
│   │   └── page.tsx
│   ├── components/
│   │   └── IssueMap.tsx
│   ├── lib/
│   │   ├── db/            # Neon Postgres client / query helpers
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── providers/
├── public/
│   └── screenshots/
├── package.json
└── .env.local
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- A Neon Postgres project ([neon.tech](https://neon.tech))
- Firebase Project (Authentication enabled)
- Google AI Studio API Key
- Cloudinary Account

### 1. Clone the Repository
```bash
git clone https://github.com/Tanishq-Bansal-443/community-hero.git
cd community-hero
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root (see [Environment Variables](#-environment-variables) below).

### 4. Run Database Migrations
If using Prisma (or your chosen migration tool) against Neon:
```bash
npx prisma migrate deploy
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Open the Application
```text
http://localhost:3000
```

---

## 🔑 Environment Variables

```env
# Neon Postgres
DATABASE_URL=your_neon_connection_string
DIRECT_URL=your_neon_direct_connection_string   # only if using a pooled + direct URL setup

# Firebase Authentication only
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
FIREBASE_ADMIN_PROJECT_ID=your_project_id           # if using Firebase Admin SDK server-side
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_service_account_private_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

> [!IMPORTANT]
> You must add your own `GEMINI_API_KEY` and `DATABASE_URL` in `.env.local` to use the AI and data-persistence capabilities of this project. Firebase variables are only required for Authentication — Firestore is no longer used.

---

## 🌐 Deployment

The application is deployed on **Vercel**, with **Neon Postgres** as the managed database (Neon integrates natively with Vercel, including branch-based preview databases for pull requests).

### Build
```bash
npm run build
```

### Deploy
You can deploy the application to Vercel using the Vercel CLI:

```bash
npm i -g vercel
vercel --prod
```

Or connect the repository to your Vercel account for automatic deployments on push. Make sure the Neon `DATABASE_URL` and Firebase Auth environment variables are set in your Vercel project settings.

### Live Demo
**https://community-hero-lake.vercel.app/**

---

## 🔮 Future Improvements

We have a broader vision for Community Hero. Post-hackathon, we plan to implement:
- **IoT Sensor Sync** — Connecting smart city sensors (water pressure, traffic) to automatically open tickets.
- **Predictive Maintenance Insights** — AI-driven forecasting of infrastructure degradation hotspots.
- **Satellite / Drone Monitoring** — Macro-level detection of infrastructure shifts and large-scale damage.
- **Emergency Alert Broadcasts** — Push notifications to citizens based on hyperlocal critical hazards.
- **Blockchain Verification** — Immutable ledgers for municipal budget allocation and repair completion proof.
- **Live Real-Time Updates** — Adopt WebSockets/Server-Sent Events or Neon's change-data-capture options for instant multi-device sync, replacing polling.

---

## 🤝 Contributing

This project was developed for the **Google Community Hero Hackathon**, organized by **Coding Ninjas**.

Contributions, suggestions, and feedback are welcome — feel free to open an issue or submit a pull request.

---

## 🙏 Acknowledgements

- **Google** — For providing Gemini API and Google AI Studio.
- **Neon** — For serverless Postgres hosting.
- **Firebase** — For Authentication.
- **Vercel** — For hosting the production application.
- **Coding Ninjas** — For organizing and hosting the Community Hero Hackathon and providing an excellent platform to build impactful AI-powered solutions.
- **Cloudinary** — For image storage and delivery.
- **Leaflet & OpenStreetMap** — For enabling the interactive mapping experience.

---

## 📫 Contact

For any inquiries, feedback, or collaboration opportunities, feel free to open an issue on the [repository](https://github.com/Tanishq-Bansal-443/community-hero).

<div align="center">
<br>
<i>Crafted with ❤️ for the Google Community Hero Hackathon</i>
</div>