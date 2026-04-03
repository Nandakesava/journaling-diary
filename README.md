# 📖 Journal App with NLP Sentiment Analysis

A full-stack private journaling application that uses NLP to analyze emotional trends over a month.

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML, CSS, Vanilla JavaScript     |
| Backend    | Node.js + Express.js              |
| Database   | MongoDB (via Mongoose)            |
| NLP        | `sentiment` npm package           |
| Auth       | JWT (JSON Web Tokens) + bcryptjs  |
| Charts     | Chart.js                          |

---

## 📁 Project Structure

```
journal-app/
├── backend/
│   ├── models/
│   │   ├── User.js          ← User schema (auth)
│   │   └── Entry.js         ← Journal entry schema
│   ├── routes/
│   │   ├── auth.js          ← Register / Login routes
│   │   └── entries.js       ← CRUD + Trends routes
│   ├── middleware/
│   │   └── auth.js          ← JWT verification
│   ├── utils/
│   │   └── nlpAnalyzer.js   ← NLP sentiment logic
│   ├── .env                 ← Environment variables
│   ├── package.json
│   └── server.js            ← Main server entry point
│
└── frontend/
    └── public/
        ├── index.html
        ├── css/style.css
        └── js/app.js
```

---

## ⚙️ Setup & Run in VS Code

### Step 1 — Install MongoDB
- Download from: https://www.mongodb.com/try/download/community
- Install and start the MongoDB service

### Step 2 — Open in VS Code
```bash
# Open the project folder in VS Code
code journal-app
```

### Step 3 — Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 4 — Configure Environment
Edit `backend/.env` if needed:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/journalapp
JWT_SECRET=your_super_secret_jwt_key_change_this
```

### Step 5 — Run the Backend
```bash
# In the backend folder:
npm run dev       # with auto-restart (uses nodemon)
# OR
npm start         # without auto-restart
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

### Step 6 — Open the Frontend
Open a browser and go to:
```
http://localhost:5000
```

---

## 🚀 Features

### ✏️ Write Tab
- Write private journal entries with optional title
- NLP analyzes your text automatically on save
- Shows sentiment label (Positive / Negative / Neutral)
- Displays emotion percentages (Joy, Sadness, Anger, Fear, Surprise)
- Highlights positive and negative words detected

### 📋 Entries Tab
- View all past entries
- See dominant emotion and sentiment per entry
- Delete entries

### 📊 Trends Tab
- Summary stats: total entries, dominant emotion, avg score
- Line chart: Sentiment score over time
- Bar chart: Average emotion intensity
- Radar chart: Your emotional profile

---

## 🔌 API Endpoints

| Method | Route                  | Description            | Auth Required |
|--------|------------------------|------------------------|---------------|
| POST   | /api/auth/register     | Register new user      | No            |
| POST   | /api/auth/login        | Login user             | No            |
| POST   | /api/entries           | Save new entry + NLP   | Yes           |
| GET    | /api/entries           | Get all entries        | Yes           |
| GET    | /api/entries/trends    | Get 30-day trends      | Yes           |
| GET    | /api/entries/:id       | Get single entry       | Yes           |
| DELETE | /api/entries/:id       | Delete entry           | Yes           |

---

## 🧠 How the NLP Works (No AI API!)

The sentiment analysis is done entirely by the backend using:

1. **`sentiment` npm package** — scores text based on AFINN word list
   - Positive words add to score, negative words subtract
   - Final score: Very Positive (≥5), Positive (≥2), Neutral, Negative, Very Negative

2. **Custom emotion word dictionaries** (in `nlpAnalyzer.js`)
   - Joy words: happy, excited, grateful, love...
   - Sadness words: sad, cry, lonely, hopeless...
   - Anger words: angry, frustrated, hate, rage...
   - Fear words: scared, anxious, worried, panic...
   - Surprise words: shocked, amazed, unexpected...

3. **Scoring** — counts matching emotion words, converts to percentages

---

## 📦 Dependencies

```json
"dependencies": {
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "sentiment": "^5.0.2",
  "natural": "^6.10.4",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2"
}
```
