<div align="center">

<img src="https://img.shields.io/badge/AI%20Powered-PuLID%20%2B%20Flux-6366f1?style=for-the-badge&logo=sparkles&logoColor=white" />
<img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Replicate-AI-FF4785?style=for-the-badge&logo=replicate&logoColor=white" />
<img src="https://img.shields.io/badge/Cloudinary-Storage-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />

<br /><br />

# 🪪 AI Headshot Generator

### Generate professional LinkedIn-quality headshots in minutes using AI identity preservation.

Upload 5–10 photos · Choose a style · Get studio-quality portraits — no photographer needed.

<br />

</div>

---

## 🎬 Demo

> Click the thumbnail below to watch the full demo video.

[![Watch Demo](https://res.cloudinary.com/dpd1i7viz/video/upload/so_0/v1779627491/AI_HEADSHOT_lrybhc.jpg)](https://res.cloudinary.com/dpd1i7viz/video/upload/v1779627491/AI_HEADSHOT_lrybhc.mp4)

> **[▶ Watch Demo Video](https://res.cloudinary.com/dpd1i7viz/video/upload/v1779627491/AI_HEADSHOT_lrybhc.mp4)**

---

## ✨ Features

| Feature                         | Description                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| 📸 **Drag & Drop Upload**       | Upload 5–10 photos with drag-and-drop or file picker            |
| 🎨 **Style Presets**            | Corporate, Startup / Tech, and Executive styles                 |
| 🧠 **AI Identity Preservation** | PuLID model keeps your exact face across all outputs            |
| 💧 **Watermark Preview System** | Watermarked previews via Sharp, unlock HD after payment         |
| ⚡ **Real-time Progress**       | Live generation polling — see headshots appear as they're ready |
| ☁️ **Cloudinary Storage**       | All images stored securely in the cloud                         |
| 📱 **Fully Responsive**         | Works beautifully on mobile, tablet, and desktop                |
| 🔓 **HD Unlock Flow**           | Clean paywall-ready unlock system built in                      |

---

## 🛠 Tech Stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![CSS](https://img.shields.io/badge/CSS_Modules-1572B6?style=flat-square&logo=css3)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express)
![Multer](https://img.shields.io/badge/Multer-Upload-grey?style=flat-square)
![Sharp](https://img.shields.io/badge/Sharp-Watermark-99CC00?style=flat-square)

### AI & Storage

![Replicate](https://img.shields.io/badge/Replicate_API-FF4785?style=flat-square)
![PuLID](https://img.shields.io/badge/PuLID-Identity_Preservation-6366f1?style=flat-square)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)

---

## 📁 Project Structure

```
ai-headshot-generator/
│
├── frontend/                   # Next.js 14 app
│   ├── app/
│   │   ├── page.js             # Main UI — upload, generate, gallery
│   │   └── layout.js           # Root layout & global styles
│   └── lib/
│       └── api.js              # API client functions
│
├── backend/                    # Express.js API server
│   ├── services/
│   │   ├── pipeline.service.js     # Generation pipeline orchestrator
│   │   ├── replicate.service.js    # PuLID + Flux model runner & prompts
│   │   ├── cloudinary.service.js   # Upload helpers
│   │   └── watermark.service.js    # Sharp watermark application
│   ├── utils/
│   │   ├── sessionStore.js         # In-memory session management
│   │   └── logger.js               # Logging utility
│   └── routes/                     # Express API routes
│
├── README.md
└── LICENSE
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `18+`
- Replicate API account → [replicate.com](https://replicate.com)
- Cloudinary account → [cloudinary.com](https://cloudinary.com)

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Runs at: **http://localhost:3000**

---

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Runs at: **http://localhost:5000**

---

### Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
# Server
PORT=5000

# Replicate AI
REPLICATE_API_TOKEN=your_replicate_token_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upload Limits
MAX_FILES=10
MAX_UPLOAD_SIZE_MB=10
```

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

---

## 🔄 AI Generation Pipeline

```
📤 Upload Photos
      ↓
✅ Validation (5–10 images, size check)
      ↓
☁️  Cloudinary Upload
      ↓
🔍 Best Face Selection
      ↓
🧠 PuLID Identity Preservation
      ↓
🎨 Flux AI Generation (per style prompt)
      ↓
💧 Sharp Watermark Applied
      ↓
🖼️  Preview Displayed in Frontend
      ↓
🔓 Unlock HD — Remove Watermark
```

---

## 📡 API Reference

### `POST /api/upload`

Upload user photos for processing.

**Request:** `multipart/form-data` with `images[]` field

**Response:**

```json
{ "sessionId": "abc123" }
```

---

### `POST /api/generate`

Start AI headshot generation for a session.

**Request:**

```json
{
  "sessionId": "abc123",
  "style": "corporate"
}
```

---

### `GET /api/results/:sessionId/status`

Poll generation progress.

**Response:**

```json
{
  "status": "processing",
  "generatedCount": 2
}
```

| Status       | Meaning                |
| ------------ | ---------------------- |
| `processing` | Generation in progress |
| `completed`  | All headshots ready    |
| `failed`     | Generation error       |

---

### `GET /api/results/:sessionId`

Fetch all generated images for a session.

---

### `POST /api/unlock`

Return original HD image URLs (post-payment).

**Request:**

```json
{ "sessionId": "abc123" }
```

---

## 🎨 Available Styles

| Style                 | Description                        | Best For                             |
| --------------------- | ---------------------------------- | ------------------------------------ |
| 🏢 **Corporate**      | Navy suit, formal office setting   | Traditional industries, finance, law |
| 🚀 **Startup / Tech** | Smart casual, modern workspace     | Tech founders, product managers      |
| 👔 **Executive**      | Luxury attire, premium environment | C-suite, senior leadership           |

---

## 💧 Watermark System

```
Generated Image
      ↓
Sharp applies watermark overlay
      ↓
Watermarked URL → stored in session (shown to user)
Original HD URL → stored in session (locked)
      ↓
On unlock → return Original HD URL
```

- Watermarked images are served as previews
- Original HD images remain locked in Cloudinary
- On payment/unlock, the `originalUrl` is returned to the client
- Both URLs are stored per-image in the session store

---

## 📸 Upload Guidelines

For best AI results:

- ✅ **5–10 photos** recommended
- ✅ Clear, well-lit face shots
- ✅ Variety of angles and expressions
- ✅ Supports **JPG**, **PNG**, **HEIC**
- ❌ Avoid heavy filters or sunglasses
- ❌ Avoid group photos

---

## 🗺️ Roadmap

- [x] Core generation pipeline
- [x] Style presets (Corporate, Startup, Executive)
- [x] Watermark preview system
- [x] HD unlock flow
- [x] Real-time progress polling
- [x] Responsive SaaS UI
- [ ] Stripe payment integration
- [ ] User accounts & history
- [ ] More style presets
- [ ] Batch download (ZIP)
- [ ] Email delivery of headshots

---

## 👤 Author

**Krish Jain**

---

## 📄 License

**Proprietary License — All Rights Reserved**

Unauthorized copying, modification, distribution, or commercial use of this project or any portion of it is strictly prohibited without explicit written permission from the author.

---

<div align="center">

Made with ☕ and a lot of GPU time

</div>
