# 🚀 NekoLabs API - Modular Architecture

API server dengan sistem **auto-load routes** yang modular dan scalable.

## 📁 Project Structure

```
project/
├── server.js                 # Main server (auto-load routes)
├── package.json
├── routes/                   # All API routes (auto-loaded)
│   ├── tiktok.js            # TikTok downloader
│   ├── youtube.js           # YouTube search & download
│   ├── spotify.js           # Spotify downloader
│   ├── instagram.js         # Instagram downloader
│   ├── facebook.js          # Facebook downloader
│   ├── anhmoe.js            # Anhmoe random images
│   ├── ideogram.js          # AI image generator
│   ├── image.js             # Image processing (removebg, ocr, screenshot)
│   ├── mal.js               # MyAnimeList API
│   ├── search.js            # Search engines (cookpad, lyrics)
│   ├── random.js            # Random images (ba, china)
│   └── news.js              # News API
├── utils/
│   ├── HTTPClient.js        # Reusable HTTP client with retry
│   └── validation.js        # Validation helpers
└── public/
    └── index.html           # API documentation frontend
```

## ✨ Features

### 🔄 Auto-Load System
- **Otomatis load semua routes** dari folder `routes/`
- **Tidak perlu edit server.js** saat tambah endpoint baru
- **Metadata otomatis** ter-collect untuk dokumentasi

### 📦 Modular Routes
Setiap route file harus export:
```javascript
// routes/example.js
import { Router } from "express";

const router = Router();

// Your endpoints here
router.get("/api/example", (req, res) => {
  res.json({ success: true });
});

// Metadata for auto-documentation
export const metadata = {
  name: "Example API",
  path: "/api/example",
  method: "GET",
  description: "Example endpoint",
  params: []
};

export default router;
```

### 🎯 How It Works

1. **Server starts** → Scan folder `routes/`
2. **Load all `.js` files** → Import as ES modules
3. **Register routes** → `app.use("/", route.default)`
4. **Collect metadata** → Build endpoints array
5. **Serve documentation** → `/api/docs` returns all endpoints

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install express axios cheerio uuid yt-search form-data chalk
```

### 2. Create Folders
```bash
mkdir routes utils public
```

### 3. Add Files
Copy semua artifacts ke folder yang sesuai:
- `server.js` → root
- `utils/HTTPClient.js` → utils folder
- `utils/validation.js` → utils folder
- `routes/tiktok.js` → routes folder
- `routes/youtube.js` → routes folder
- `routes/random.js` → routes folder
- `routes/spotify.js` → routes folder
- `index.html` → public folder

### 4. Run Server
```bash
node server.js
```

## ➕ Adding New Endpoints

### Example: Tambah Endpoint Instagram

1. **Create file** `routes/instagram.js`:
```javascript
import { Router } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { validate, asyncHandler } from "../utils/validation.js";

const router = Router();

router.get("/api/instagram/download", asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!validate.url(url, "instagram.com")) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid Instagram URL" 
    });
  }
  
  // Your logic here
  const encoded = encodeURIComponent(url);
  const response = await axios.get(`https://igram.website/content.php?url=${encoded}`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0"
    }
  });
  
  const json = response.data;
  const $ = cheerio.load(json.html);
  const thumb = $("img.w-100").attr("src");
  const download = $('a:contains("Download HD")').attr("href");
  
  res.json({
    success: true,
    data: { thumb, download }
  });
}));

router.post("/api/instagram/download", asyncHandler(async (req, res) => {
  // Same logic as GET
  const { url } = req.body;
  // ... your code
}));

export const metadata = {
  name: "Instagram Download",
  path: "/api/instagram/download",
  method: "GET, POST",
  description: "Download Instagram photos and videos",
  params: [
    {
      name: "url",
      type: "text",
      required: true,
      placeholder: "https://www.instagram.com/p/xxxxx",
      description: "Instagram post URL"
    }
  ]
};

export default router;
```

2. **Save file** → Server auto-load saat restart
3. **Done!** ✅ Endpoint langsung available di `/api/docs`

## 📝 Route Template

Copy template ini untuk endpoint baru:

```javascript
import { Router } from "express";
import { validate, asyncHandler } from "../utils/validation.js";

const router = Router();

// GET endpoint
router.get("/api/your-path", asyncHandler(async (req, res) => {
  const { param1 } = req.query;
  
  // Your logic here
  
  res.json({ success: true, data: result });
}));

// POST endpoint
router.post("/api/your-path", asyncHandler(async (req, res) => {
  const { param1 } = req.body;
  
  // Your logic here
  
  res.json({ success: true, data: result });
}));

// Metadata for documentation
export const metadata = {
  name: "Your API Name",
  path: "/api/your-path",
  method: "GET, POST",
  description: "What does this endpoint do?",
  params: [
    {
      name: "param1",
      type: "text",
      required: true,
      placeholder: "example value",
      description: "Parameter description"
    }
  ]
};

export default router;
```

## 🔧 Utils Available

### HTTPClient
```javascript
import HTTPClient from "../utils/HTTPClient.js";

class MyAPI extends HTTPClient {
  constructor() {
    super("https://api.example.com", {
      timeout: 30000,
      headers: { "Custom-Header": "value" }
    });
  }
  
  async getData() {
    return await this.get("/endpoint");
  }
}
```

### Validation
```javascript
import { validate, asyncHandler } from "../utils/validation.js";

// Check if string not empty
validate.notEmpty("hello") // true

// Check if valid URL
validate.url("https://example.com") // true

// Check if URL contains domain
validate.url("https://github.com/user", "github.com") // true

// Async handler (auto catch errors)
router.get("/api/test", asyncHandler(async (req, res) => {
  // Your async code
  //