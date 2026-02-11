# CreateKit

CreateKit is a full-stack AI-powered web application that enables authenticated users to generate, manage, publish, and share AI-generated content and images. It also provides resume analysis and image processing workflows such as background and object removal.

The platform combines AI generation capabilities with structured content management, user authentication, and cloud-based media storage.

---

## Overview

CreateKit follows a client-server architecture:

- **Frontend:** React 19 + TypeScript (Vite)
- **Backend:** Node.js + Express 5 + TypeScript
- **Database:** NeonDB (Serverless PostgreSQL)
- **Authentication:** Clerk
- **Media Storage:** Cloudinary
- **AI Services:** OpenAI + Krea API

The goal of the project is to provide a structured AI toolkit where users can not only generate content but also save, publish, and manage it within a secure environment.

---

## Core Features

### AI Content Generation

- Generate full-length articles
- Generate blog titles
- Powered by OpenAI

Endpoints:
```

POST /api/ai/generate-article
POST /api/ai/generate-blog-title

```

---

### AI Image Generation & Processing

- Generate AI images using Krea API
- Remove image backgrounds
- Remove specific objects from images
- Cloudinary-backed storage and transformations

Endpoint:
```

POST /api/ai/generate-image

```

---

### Resume Review

- Upload resume files (PDF)
- Extract content using `pdf-parse`
- Get structured AI-based feedback

Endpoint:
```

POST /api/ai/resume-review

```

---

### User Creations Management

Authenticated users can:

- Save creations
- Fetch their creations
- Toggle likes
- Toggle publish state
- Share published creations

Endpoints:
```

GET    /api/user/creations
POST   /api/user/save
POST   /api/user/toggle-like
POST   /api/user/toggle-publish

```

All protected routes require Clerk authentication middleware.

---

## Tech Stack

### Frontend

- React 19
- Vite
- TypeScript
- TailwindCSS
- React Router DOM
- Clerk React
- React Hot Toast

### Backend

- Node.js
- Express 5
- TypeScript
- Clerk Express
- NeonDB (`@neondatabase/serverless`)
- Cloudinary
- OpenAI
- Krea API
- Multer (memory storage)
- pdf-parse
- CORS

---

## Architecture

CreateKit maintains a clear separation of responsibilities:

- **Client:** Handles UI, routing, authentication state, and API communication
- **Server:** Handles business logic, AI integrations, file processing, and database operations
- **Database:** Stores users and their creations
- **Cloudinary:** Stores and transforms media assets
- **AI Providers:** Generate content, images, and resume insights

The backend is built with serverless-compatible patterns, including lazy Cloudinary initialization and in-memory file handling.

---

## File Handling

- Multer with memory storage
- 5MB file size limit
- Resume parsing via `pdf-parse`
- Images processed and stored in Cloudinary
- No files are written to disk

---

## Environment Variables

Example configuration:

```

CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
DATABASE_URL=
OPENAI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
KREA_API_KEY=

```

---

## Running Locally

### 1. Clone the repository

```

git clone <your-repo-url>
cd createkit

```

### 2. Install dependencies

Frontend:
```

cd client
npm install

```

Backend:
```

cd server
npm install

```

### 3. Add environment variables

Create `.env` files inside both the `client` and `server` directories.

### 4. Start development servers

Backend:
```

npm run dev

```

Frontend:
```

npm run dev

```

---

## Deployment

The project is compatible with serverless deployment platforms such as Vercel.  
Ensure all environment variables are properly configured in your deployment environment.

---

Thank you for checking out CreateKit.
```
