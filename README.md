# AI Headshot Generator

Professional AI-powered LinkedIn headshot generator built using Next.js, Express.js, Replicate AI, PuLID, Cloudinary, and Sharp.

Generate realistic professional headshots from uploaded photos using AI identity preservation models.

---

# Features

- Upload 5–10 photos
- AI-generated professional headshots
- Multiple style presets
- PuLID identity preservation
- Watermarked preview system
- Unlock HD images
- Responsive modern SaaS UI
- Real-time generation progress
- Cloudinary image storage
- Drag & drop upload support
- Mobile responsive design

---

# Tech Stack

## Frontend

- Next.js 14
- React
- CSS

## Backend

- Node.js
- Express.js
- Multer
- Sharp

## AI / Storage

- Replicate API
- PuLID
- Cloudinary

---

# Project Structure

project/
│
├── frontend/
│
├── backend/
│
├── README.md
│
└── LICENSE

---

# Frontend Setup

cd frontend

npm install

npm run dev

Frontend runs on:

http://localhost:3000

---

# Backend Setup

cd backend

npm install

npm run dev

Backend runs on:

http://localhost:5000

---

# Environment Variables

Create `.env` file inside backend folder:

PORT=5000

REPLICATE_API_TOKEN=your_token

CLOUDINARY_CLOUD_NAME=your_name

CLOUDINARY_API_KEY=your_key

CLOUDINARY_API_SECRET=your_secret

MAX_FILES=10

MAX_UPLOAD_SIZE_MB=10

---

# AI Generation Flow

Upload Photos
↓
Validation
↓
Cloudinary Upload
↓
Best Face Selection
↓
PuLID Identity Preservation
↓
AI Headshot Generation
↓
Sharp Watermark Preview
↓
Frontend Preview Display
↓
Unlock HD Images

---

# API Routes

## Upload Images

POST /api/upload

Uploads user images.

---

## Generate Headshots

POST /api/generate

Starts AI generation pipeline.

Request body:

{
"sessionId": "abc123",
"style": "corporate"
}

---

## Poll Generation Status

GET /api/results/:sessionId/status

Returns:

{
"status": "processing",
"generatedCount": 2
}

---

## Get Results

GET /api/results/:sessionId

---

## Unlock Images

POST /api/unlock

Returns original HD image URLs.

---

# Available Styles

- Corporate
- Startup / Tech
- Executive

---

# Watermark System

Generated images are:

- stored originally in Cloudinary
- watermarked using Sharp
- previewed on frontend
- unlockable later after payment integration

---

# Future Improvements

- Payment integration

---

# Notes

- Recommended upload count: 5–10 photos
- Best results with clear face images
- Supports JPG, PNG, HEIC

---

# Author

Krish Jain

---

# License

Proprietary License — All Rights Reserved

Unauthorized copying, modification, distribution, or commercial use of this project is prohibited.
