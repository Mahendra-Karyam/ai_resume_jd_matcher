# AI Resume & Job Description Matcher (MERN)

Full-stack MERN app that uses the Google Gemini API to parse resumes/job descriptions and produce
an AI-generated match score, skill-gap breakdown, and tailored improvement suggestions.

## Stack
- **Frontend:** React (Vite) + Tailwind CSS + React Router + Recharts + React Dropzone
- **Backend:** Node.js + Express + Multer + pdf-parse + mammoth
- **Database:** MongoDB (Mongoose)
- **AI:** Google Gemini API (`@google/genai`, free tier, `gemini-3.6-flash`) — resume parsing, JD parsing, and matching/scoring
- **Auth:** JWT + bcrypt

## Project Structure
```
mern-resume-matcher/
├── server/ Express API
│ ├── config/db.js MongoDB connection
│ ├── models/ User, Resume, JobPosting, Match (Mongoose schemas)
│ ├── middleware/ auth.js (JWT guard), upload.js (Multer)
│ ├── controllers/ business logic per resource
│ ├── routes/ REST endpoints
│ ├── utils/
│ │ ├── parseFile.js PDF/DOCX -> text (pdf-parse, mammoth)
│ │ └── aiClient.js Gemini API calls: extract resume, extract JD, match & score
│ └── server.js app entry point
└── client/ React app
└── src/
├── api/axios.js axios instance w/ JWT interceptor
├── context/AuthContext.jsx
├── components/ ResumeUpload, JobDescriptionInput, ScoreGauge, SkillGapChart, Navbar
└── pages/ Home, Login, Register, Dashboard, MatchResult, MatchHistory

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY in .env
npm install
npm run dev        # starts on https://ai-resume-jd-matcher-uftn.onrender.com
```

### 2. Frontend
```bash
cd client
npm install
npm run dev         # starts on https://ai-resume-jd-matcher-1-pvtg.onrender.com
```

### 3. MongoDB
Use a local MongoDB instance or a free MongoDB Atlas cluster. Paste the connection string
into `server/.env` as `MONGO_URI`.

### 4. Google Gemini API Key (free tier)
Get a key from https://aistudio.google.com (no card required) and set `GEMINI_API_KEY` in `server/.env`.
This powers three things in `utils/aiClient.js`:
- `extractResumeData()` — structured skills/education/experience from raw resume text
- `extractJobRequirements()` — required skills from a pasted job description
- `matchResumeToJob()` — match score (0-100), matched/missing skills, and improvement suggestions

## API Endpoints

| Method | Route                | Description                          | Auth |
|--------|-----------------------|---------------------------------------|------|
| POST   | /api/auth/register     | Create account                        | No   |
| POST   | /api/auth/login        | Login, get JWT                        | No   |
| GET    | /api/auth/me           | Current user                          | Yes  |
| POST   | /api/resumes/upload    | Upload + AI-parse resume (PDF/DOCX)   | Yes  |
| GET    | /api/resumes           | List my resumes                       | Yes  |
| GET    | /api/resumes/:id       | Get one resume                        | Yes  |
| DELETE | /api/resumes/:id       | Delete resume                         | Yes  |
| POST   | /api/jobs               | Save + AI-parse job description       | Yes  |
| GET    | /api/jobs               | List my job descriptions              | Yes  |
| DELETE | /api/jobs/:id           | Delete job description                | Yes  |
| POST   | /api/matches            | Run AI match (resumeId + jobId)       | Yes  |
| GET    | /api/matches            | List my match history                 | Yes  |
| GET    | /api/matches/:id        | Get one match result                  | Yes  |
| DELETE | /api/matches/:id        | Delete a match result                 | Yes  |

## Next Steps / Ideas to Extend
- Add MongoDB Atlas Vector Search to compare a resume against many jobs at once
- Add a "resume rewrite" endpoint that uses Gemini to rewrite bullet points for a target JD
- Add file storage to S3/Cloudinary instead of local disk for production
- Add pagination + search on resume/job/match history
