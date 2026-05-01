<img width="1470" height="795" alt="image" src="https://github.com/user-attachments/assets/e5bd447b-8bf6-4566-a3cc-656a310dd129" />
# TaskFlow — Team Task Management Web Application

![TaskFlow Banner](https://img.shields.io/badge/TaskFlow-Team%20Task%20Management-7c6aff?style=for-the-badge&logo=task&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

A full-stack collaborative task management web application where teams can create projects, assign tasks, and track progress in real time. Built as a simplified version of tools like Trello or Asana.

---

## 🌐 Live Demo

| URL |
|---|---|
https://taskflow-production-7242.up.railway.app/
---

## ✨ Features

### 👤 User Authentication
- Signup with Name, Email & Password
- Secure JWT-based login with 7-day token expiry
- Protected routes — unauthenticated users redirected to login
- Profile management

### 📁 Project Management
- Create color-coded projects
- Project creator automatically becomes **Admin**
- Admin can add/remove members by email
- Members can view only their assigned projects

### ✅ Task Management
- Create tasks with Title, Description, Due Date & Priority (Low / Medium / High)
- Assign tasks to specific team members
- Update task status: **To Do → In Progress → Done**
- Filter tasks by status and priority

### 📊 Dashboard
- Total projects, tasks, and overdue counts
- Task breakdown by status with progress bars
- Completion rate percentage
- Recent tasks overview

### 📈 Project Analytics
- Tasks by status (visual progress bars)
- Tasks by priority breakdown
- Tasks per team member
- Overdue tasks list with assignee info

### 🔐 Role-Based Access Control

| Action                | Admin | Member |
|---|---|---|
| Create tasks          | ✅ | ❌ |
| Edit all task fields  | ✅ | ❌ |
| Delete tasks          | ✅ | ❌ |
| Update task status    | ✅ | ✅ (own tasks only)|
| Add/remove members    | ✅ | ❌ |
| Delete project        | ✅ | ❌ |
| View project & tasks  | ✅ | ✅ |

---

## 🛠 Tech Stack

### Frontend
- **React 18** — UI library
- **Vite** — Build tool
- **React Router v6** — Client-side routing
- **Axios** — HTTP client
- **date-fns** — Date formatting

### Backend
- **Node.js + Express** — REST API server
- **Mongoose** — MongoDB ODM
- **JWT (jsonwebtoken)** — Authentication
- **bcryptjs** — Password hashing
- **express-validator** — Input validation
- **CORS** — Cross-origin resource sharing

### Database
- **MongoDB Atlas** — Cloud NoSQL database

### Deployment
- **Railway** — Backend + Frontend hosting
- **MongoDB Atlas** — Database hosting

---

## 📁 Project Structure

```
taskflow/
├── package.json                  # Root — runs both services
├── server/                       # Express Backend
│   ├── index.js                  # Entry point
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Project.js            # Project + members schema
│   │   └── Task.js               # Task schema
│   ├── routes/
│   │   ├── auth.js               # Register, Login, Profile
│   │   ├── projects.js           # CRUD + member management
│   │   ├── tasks.js              # CRUD + role-based access
│   │   ├── dashboard.js          # Stats & analytics
│   │   └── users.js              # User search
│   └── middleware/
│       └── auth.js               # JWT protect middleware
└── client/                       # React Frontend
    ├── index.html
    └── src/
        ├── App.jsx               # Routes & layout
        ├── main.jsx
        ├── index.css             # Global dark theme styles
        ├── context/
        │   └── AuthContext.jsx   # Global auth state
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── ProjectsPage.jsx
        │   ├── ProjectDetailPage.jsx
        │   ├── TasksPage.jsx
        │   └── ProfilePage.jsx
        ├── components/
        │   └── Layout.jsx        # Sidebar + nav
        └── utils/
            └── api.js            # Axios instance
```

---

## 🗄️ Database Schema

### User
```
_id, name, email, password (hashed), createdAt, updatedAt
```

### Project
```
_id, name, description, color, createdBy (ref: User),
members: [{ user (ref: User), role: 'Admin' | 'Member' }],
createdAt, updatedAt
```

### Task
```
_id, title, description, status ('To Do' | 'In Progress' | 'Done'),
priority ('Low' | 'Medium' | 'High'), dueDate, project (ref: Project),
assignedTo (ref: User), createdBy (ref: User), createdAt, updatedAt
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |

### Projects
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/projects` | Get all user projects | ✅ |
| POST | `/api/projects` | Create project | ✅ |
| GET | `/api/projects/:id` | Get project by ID | ✅ |
| PUT | `/api/projects/:id` | Update project | ✅ Admin |
| DELETE | `/api/projects/:id` | Delete project | ✅ Admin |
| POST | `/api/projects/:id/members` | Add member | ✅ Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | ✅ Admin |

### Tasks
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/tasks?project=id` | Get project tasks | ✅ |
| POST | `/api/tasks` | Create task | ✅ Admin |
| GET | `/api/tasks/:id` | Get task by ID | ✅ |
| PUT | `/api/tasks/:id` | Update task | ✅ |
| DELETE | `/api/tasks/:id` | Delete task | ✅ Admin |

### Dashboard
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/dashboard` | Global dashboard stats | ✅ |
| GET | `/api/dashboard/project/:id` | Project analytics | ✅ |

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/adityasaini21/taskflow.git
cd taskflow
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Go back to root
cd ..
```

### 3. Configure environment variables
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

### 4. Run the application
```bash
# From root folder — runs both frontend and backend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## ☁️ Deployment Guide

### MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user with password
3. Allow access from anywhere (`0.0.0.0/0`)
4. Copy connection string

### Railway (Backend)
1. Create new project → Deploy from GitHub
2. Set **Root Directory** to `server`
3. Set **Start Command** to `node index.js`
4. Add environment variables:
   - `MONGO_URI` = Atlas connection string
   - `JWT_SECRET` = random secret string
   - `JWT_EXPIRE` = `7d`
   - `NODE_ENV` = `production`

### Railway (Frontend)
1. Add second service → same GitHub repo
2. Set **Root Directory** to `client`
3. Set **Build Command** to `npm install && npm run build`
4. Set **Start Command** to `npx serve dist -l 3000`
5. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.up.railway.app/api`

---

## 👥 How Roles Work

| How you get the role | Role |
|---|---|
| Create a project | **Admin** |
| Get invited to a project | **Member** |

Admins can promote members to Admin when adding them via the Members tab.

---

## 📸 Screenshots

<img width="1470" height="804" alt="image" src="https://github.com/user-attachments/assets/dc3d7150-748a-4f2b-bc1c-d426c1250ce4" />
<img width="1470" height="807" alt="image" src="https://github.com/user-attachments/assets/2dbb163a-102b-4d94-aaae-c2d771f0446d" />
<img width="1470" height="795" alt="image" src="https://github.com/user-attachments/assets/103a5949-191c-4af3-86ce-8ef4014884ce" />
<img width="1470" height="800" alt="image" src="https://github.com/user-attachments/assets/3afb3a31-b09c-4efa-bfdd-350ca24ec7ff" />





| Dashboard | Projects | Tasks |
|---|---|---|
| ![Dashboard](#) | ![Projects](#) | ![Tasks](#) |

---

## 🙋 Author

**Aditya Saini**

[![GitHub](https://github.com/adityasaini21)
[![LinkedIn](https://www.linkedin.com/in/aditya-saini-12430a255/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
