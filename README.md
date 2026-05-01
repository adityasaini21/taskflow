# TaskFlow — Team Task Management App

A full-stack collaborative task management web application built with:
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (JSON Web Tokens)

## Project Structure

```
taskflow/
├── package.json          # Root (runs both client & server)
├── server/               # Express backend
│   ├── index.js
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── middleware/       # Auth middleware
└── client/               # React + Vite frontend
    └── src/
        ├── pages/        # Page components
        ├── components/   # Shared components
        ├── context/      # Auth context
        └── utils/        # API utility
```

## Quick Start

See SETUP.md for step-by-step instructions.


Live Link : https://taskflow-production-7242.up.railway.app/
