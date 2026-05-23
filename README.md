# AI Headshot Generator

Generate professional LinkedIn-style headshots from user photos using FLUX 2 Pro + InstantID on Replicate, with Cloudinary for storage.

---

## Architecture

```
Frontend (Next.js :3000)
        │
        ▼
Backend (Express :4000)
   ├── POST /api/upload      → multer → Cloudinary
   ├── POST /api/generate    → Replicate (FLUX Pro + InstantID)
   └── GET  /api/results/:id → session store → gallery
```

### AI Pipeline

1. **InstantID** – uses best reference face image + prompt → face-consistent headshots (preserves likeness)
2. **FLUX 1.1 Pro** – high-quality text-to-image → diverse, premium headshots

Both outputs are persisted to Cloudinary for reliable storage.

---

## Quick Start

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

**Backend** (`backend/.env`):
```env
PORT=4000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
REPLICATE_API_TOKEN=r8_...
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Get API keys

| Service | Where to get it |
|---------|----------------|
| Cloudinary | https://cloudinary.com → Dashboard |
| Replicate | https://replicate.com/account/api-tokens |

### 4. Run

```bash
# Terminal 1 – backend
cd backend && npm run dev

# Terminal 2 – frontend
cd frontend && npm run dev
```

Open http://localhost:3000

---

## API Reference

### `POST /api/upload`
Upload 5–10 photos.

**Request:** `multipart/form-data`, field name `images`

**Response:**
```json
{
  "sessionId": "uuid",
  "uploadedCount": 7,
  "uploadedImages": [{ "url": "...", "publicId": "..." }],
  "bestImages": [{ "url": "...", "publicId": "..." }]
}
```

---

### `POST /api/generate`
Start AI generation for a session.

**Request:**
```json
{ "sessionId": "uuid", "style": "corporate" }
```

Styles: `corporate` | `startup` | `executive`

**Response:** `202 Accepted`
```json
{ "sessionId": "uuid", "status": "processing", "estimatedSeconds": 60 }
```

---

### `GET /api/results/:sessionId/status`
Poll for generation status.

**Response:**
```json
{ "status": "processing|completed|failed", "generatedCount": 3 }
```

---

### `GET /api/results/:sessionId`
Fetch all generated images.

**Response:**
```json
{
  "status": "completed",
  "generatedImages": [
    { "url": "https://res.cloudinary.com/...", "model": "InstantID", "prompt": "..." }
  ]
}
```

---

## Project Structure

```
project/
├── backend/
│   ├── routes/
│   │   ├── upload.routes.js
│   │   ├── generate.routes.js
│   │   └── results.routes.js
│   ├── controllers/
│   │   ├── upload.controller.js
│   │   ├── generate.controller.js
│   │   └── results.controller.js
│   ├── services/
│   │   ├── cloudinary.service.js      # Cloudinary SDK wrapper
│   │   ├── replicate.service.js       # FLUX Pro + InstantID
│   │   ├── generation.service.js      # Orchestration pipeline
│   │   └── imageSelection.service.js  # Best-image picker
│   ├── utils/
│   │   ├── multerConfig.js
│   │   ├── sessionStore.js            # In-memory (swap for Redis)
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── uploads/                       # Temp storage (auto-cleaned)
│   └── server.js
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.js
        │   └── page.js                # Upload + gallery UI
        └── lib/
            └── api.js                 # Typed API client
```

---

## Future Features (code structured, not implemented)

### Watermarking
Add in `cloudinary.service.js` → `applyWatermark(publicId)` using Cloudinary transformations.

### Payment Gate
After payment, call a new endpoint to return non-watermarked Cloudinary URLs.

### Queue (BullMQ + Redis)
Replace the async fire-and-forget in `generate.controller.js` with a BullMQ job. Replace `sessionStore.js` Map with Redis.

### Face Quality Validation
Swap `imageSelection.service.js` body to call an InsightFace/OpenCV microservice and score by face clarity, size, and frontal angle.

---

## Notes

- Session data is in-memory and resets on server restart. Add Redis for persistence.
- Replicate predictions can take 30–90 seconds depending on queue depth.
- InstantID requires a clear, frontal face photo as reference.
