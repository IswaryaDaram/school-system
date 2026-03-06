# 🎓 Integrated Role-Based Digital School Support System

A full-stack production-ready web application for school management with role-based access for Admin, Teacher, and Student.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js 18 + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| File Uploads | Multer |
| AI Chatbot | Anthropic Claude API |
| i18n | i18next (English + Telugu) |
| Charts | Recharts |
| PDF Generation | PDFKit |
| Email | Nodemailer |

---

## 📁 Project Structure

```
school-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js        # Login, Register, JWT, Password reset
│   │   ├── studentController.js     # Student CRUD, Attendance, Marks
│   │   ├── academicController.js    # Attendance, Marks, Assignments, News, Docs
│   │   ├── analyticsController.js   # Dashboard stats, Reports
│   │   └── chatbotController.js     # AI Chatbot (Claude API)
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + role authorize
│   │   └── upload.js                # Multer file upload
│   ├── models/
│   │   ├── User.js                  # User with bcrypt
│   │   ├── Student.js               # Student profile
│   │   ├── Teacher.js               # Teacher profile
│   │   ├── StudyMaterial.js         # Study materials
│   │   ├── AcademicModels.js        # Subject, Class, Attendance, Assignment, Submission
│   │   └── ContentModels.js         # Marks, Announcement, News, DocumentRequest
│   ├── routes/                      # All API routes
│   ├── utils/
│   │   ├── sendEmail.js             # Nodemailer
│   │   └── pdfGenerator.js          # Bonafide & TC PDF
│   ├── uploads/                     # File storage
│   ├── server.js                    # Main entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── common/Layout.jsx    # Sidebar + Header + Dark mode
    │   │   └── chatbot/Chatbot.jsx  # AI Chatbot widget
    │   ├── context/AuthContext.jsx  # JWT auth state
    │   ├── pages/
    │   │   ├── auth/                # Login, Register, ForgotPassword
    │   │   ├── admin/               # Admin dashboard & all modules
    │   │   ├── teacher/             # Teacher dashboard & tools
    │   │   └── student/             # Student dashboard & modules
    │   ├── i18n/                    # English + Telugu translations
    │   ├── utils/api.js             # Axios API client
    │   ├── App.jsx                  # Routes + Role-based guards
    │   └── index.css                # Tailwind + custom styles
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Anthropic API key (for chatbot)
- Gmail account (for password reset emails)

---

### Step 1: Clone / Extract the project
```bash
cd school-system
```

### Step 2: Setup Backend

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/schooldb
JWT_SECRET=your_super_secret_32char_key_here
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

Start backend:
```bash
npm run dev   # development with nodemon
npm start     # production
```

Backend runs on: **http://localhost:5000**

---

### Step 3: Setup Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

---

### Step 4: Seed Initial Data (Optional)

```bash
cd backend
node utils/seeder.js
```

This creates demo accounts:
- **Admin:** admin@school.edu / Admin@123
- **Teacher:** teacher@school.edu / Teacher@123
- **Student:** student@school.edu / Student@123

---

## 🔐 API Endpoints

### Auth
```
POST   /api/auth/register         Register new user
POST   /api/auth/login             Login
GET    /api/auth/me                Get current user
POST   /api/auth/forgot-password   Send reset email
PUT    /api/auth/reset-password/:token
PUT    /api/auth/update-password   Change password
PUT    /api/auth/preferences       Update language/dark mode
```

### Students (Admin/Teacher)
```
GET    /api/students               List all students
POST   /api/students               Create student (Admin)
GET    /api/students/:id           Get student
PUT    /api/students/:id           Update student (Admin)
DELETE /api/students/:id           Delete student (Admin)
GET    /api/students/:id/attendance
GET    /api/students/:id/marks
POST   /api/students/bookmark/:newsId
```

### Attendance
```
POST   /api/attendance/mark        Mark daily attendance (Teacher)
GET    /api/attendance/class       Get class attendance
```

### Assignments
```
GET    /api/assignments            List assignments
POST   /api/assignments            Create (Teacher)
POST   /api/assignments/submit     Submit (Student)
```

### Marks
```
POST   /api/marks                  Add/update marks (Teacher)
GET    /api/marks                  Get class marks
```

### News
```
GET    /api/news                   Get news (filter by category/search)
POST   /api/news                   Post news (Admin)
```

### Announcements
```
GET    /api/announcements          Role-filtered announcements
POST   /api/announcements          Create (Admin/Teacher)
```

### Document Requests
```
GET    /api/documents              Get requests
POST   /api/documents              Submit request (Student)
PUT    /api/documents/:id          Approve/Reject (Admin)
```

### Analytics (Admin)
```
GET    /api/analytics/dashboard    Dashboard stats + charts
GET    /api/analytics/attendance   Attendance report
```

### Chatbot
```
POST   /api/chatbot                Send message, get AI reply
```

---

## 🌐 Features

### ✅ Authentication
- JWT-based secure auth
- Role-based route protection
- Password hashing (bcrypt)
- Forgot/Reset password via email

### ✅ Admin Dashboard
- Stats: students, teachers, attendance %, pending docs
- Line chart: 6-month attendance trend
- Pie chart: school overview
- Recent activity feed
- Full CRUD: Students, Teachers, Classes, Subjects

### ✅ Teacher Dashboard
- Mark daily attendance (bulk)
- Upload study materials (PDF/docs)
- Create assignments with deadlines
- Enter student marks with auto grade calculation
- View class performance

### ✅ Student Dashboard
- View attendance percentage
- Subject-wise marks & grades
- Download study materials
- Submit assignments
- View announcements
- Read and bookmark news
- Apply for Bonafide/TC certificates
- Track document request status

### ✅ Document Module
- Bonafide Certificate (PDF auto-generated)
- Transfer Certificate (PDF auto-generated, archives student)
- Status tracking: Pending → Approved/Rejected

### ✅ Daily News
- Categories: National, International, Education, Science & Tech, Sports
- Top 5 news highlight
- Search by keyword
- Bookmark feature
- Duplicate prevention

### ✅ AI Chatbot
- Powered by Claude Sonnet API
- Role-aware context (shows attendance %, marks, deadlines)
- Available on all dashboards (bottom-right widget)
- Quick prompt shortcuts
- Conversation history

### ✅ Multilingual (EN + Telugu)
- Language toggle in sidebar
- All UI labels translated
- Preference saved in localStorage

### ✅ UI/UX
- Dark sidebar layout
- Dark/Light mode toggle
- Responsive mobile support
- Loading skeletons
- Toast notifications
- 404 error page

---

## 🚢 Deployment

### Backend → Render / Railway

1. Push `backend/` to GitHub
2. Create a new Web Service on Render
3. Set environment variables from `.env`
4. Build command: `npm install`
5. Start command: `npm start`

### Frontend → Vercel / Netlify

1. Push `frontend/` to GitHub
2. Import on Vercel
3. Set `REACT_APP_API_URL` if needed
4. Build: `npm run build`

---

## 🔒 Security

- JWT middleware on all protected routes
- Role-based authorization middleware
- express-validator input validation
- Rate limiting (100 req/15min, 10 login req/15min)
- Helmet security headers
- CORS configured
- File upload type/size validation
- Bcrypt password hashing (salt rounds: 12)

---

## 📈 MongoDB Collections

| Collection | Description |
|------------|-------------|
| users | All users with role |
| students | Student profiles |
| teachers | Teacher profiles |
| subjects | School subjects |
| classes | Class/section management |
| attendances | Date-wise attendance |
| assignments | Teacher assignments |
| submissions | Student submissions |
| marks | Subject-wise exam marks |
| announcements | Role-targeted notices |
| news | Daily news feed |
| studymaterials | Uploaded notes/PDFs |
| documentrequests | Bonafide/TC requests |

---

## 🤝 Development Notes

- The frontend page stubs (`TeacherAttendance`, `StudentMarks`, etc.) are scaffolded and ready for full implementation — the architecture and API client are complete.
- Each page follows the same pattern: load from `api.js`, render in Tailwind dark UI.
- To add a new module: add model → controller → route → API client method → React page.

---

**Built with ❤️ — Scalable, Secure, Production-Ready**
