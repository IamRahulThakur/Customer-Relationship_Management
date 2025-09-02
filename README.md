# 📌 Mini CRM System

A full-stack **Customer Relationship Management (CRM)** application built with **React.js (frontend)** and **Node.js/Express.js (backend)** with **MongoDB**.  
Designed for sales teams to manage leads, customers, tasks, and track activities.

---

![CRM](https://img.shields.io/badge/CRM-Mini%2520CRM-blue)
![Frontend](https://img.shields.io/badge/Frontend-React.js-61dafb)
![Backend](https://img.shields.io/badge/Backend-Node.js-green)
![Database](https://img.shields.io/badge/Database-MongoDB-success)

---

## 🌟 Features

### 🔐 Authentication & Authorization
- JWT-based authentication with **secure cookies**
- Role-based access control (**Admin & Agent** roles)
- Protected routes on both frontend and backend
- Password hashing with **bcrypt**

### 👥 User Management
- Admin users can **create and manage all users**
- Agent users can **only access their own data**
- User profile management with secure password validation

### 📊 Lead Management
- Complete CRUD operations for leads
- Lead status tracking: `New`, `In Progress`, `Closed Won`, `Closed Lost`
- Advanced filtering by **status, assigned agent, and search**
- Lead conversion to customers
- Soft delete/archive functionality

### 🤝 Customer Management
- Customer database with company information
- Notes system for customer interactions
- Tagging system for customer categorization
- Ownership-based access control

### ✅ Task Management
- Task creation and assignment
- Priority levels: `Low`, `Medium`, `High`
- Status tracking: `Open`, `In Progress`, `Done`
- Due date management with **overdue indicators**
- Tasks linked to leads and customers

### 📈 Dashboard & Analytics
- Real-time statistics overview
- Leads by status visualization
- Activity feed with recent events
- Leads creation chart (last 14 days)
- My tasks overview with overdue alerts

---

## 🚀 Quick Start

### 📋 Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

---

### ⚙️ Installation

#### Clone the Repository
```bash
git clone https://github.com/IamRahulThakur/Customer-Relationship_Management.git
```

Backend Setup
```bash
cd backend
npm install

# Create environment file
touch .env
# Edit .env with your configuration
```

Frontend Setup
```bash
cd ../frontend
npm install

# Create environment file
touch .env
# Edit .env with your configuration
```

Environment Configuration
Backend (.env)
```bash
NODE_ENV= development
PORT=3000
MONGO_URI= your_mongoDB_URL
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:5173
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
BCRYPT_SALT_ROUNDS=10
```

Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_CLIENT_URL=http://localhost:5173
```

Database Setup
```bash
# Seed the database with sample data
cd backend
npm run seed
```

Running the Application
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory, in new terminal)
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:3000/api


## 📖 API Documentation
### 🔐 Authentication Endpoints

POST /api/auth/login – User login

POST /api/auth/register – Create new user (Admin only)

POST /api/auth/refresh – Refresh access token

POST /api/auth/logout – User logout

### 📊 Lead Endpoints

GET /api/lead – Get leads with filtering & pagination

POST /api/lead – Create new lead

GET /api/lead/:id – Get specific lead

PATCH /api/lead/:id – Update lead

DELETE /api/lead/:id – Archive lead

POST /api/lead/:id/convert – Convert lead to customer

### 🤝 Customer Endpoints

GET /api/customers – Get customers with filtering

POST /api/customers – Create new customer

PATCH /api/customers/:id – Update customer

POST /api/customers/:id/notes – Add note to customer

### ✅ Task Endpoints

GET /api/tasks – Get tasks with filters

POST /api/tasks – Create new task

PATCH /api/tasks/:id – Update task

### 📈 Activity Endpoints

GET /api/activity – Get activity feed

### 👥 User Endpoints

GET /api/users – Get all users (Admin only)

PATCH /api/users/:id – Update user (Admin only)

DELETE /api/users/:id – Delete user (Admin only)

## 🛠️ Technology Stack

### 🎨 Frontend 
React.js

React Router

Axios

Zustand (state management)

Tailwind CSS

Vite

### ⚡ Backend
Node.js

Express.js

MongoDB + Mongoose

JWT

bcrypt

CORS

## Deployment
### Backend Deployment (Render / Railway)

Connect repo

Set environment variables

Deploy from main branch

## Frontend Deployment (Vercel / Netlify) 
Connect repo

Set environment variables 

Build command: npm run build 

Output directory: dist 

MongoDB Atlas Setup 

Create cluster 

Create DB user with read/write permissions 

Whitelist IPs (or allow all for testing) 

Update .env with connection string


## Production Environment Variables
```bash
# Backend
NODE_ENV=production
MONGO_URI= your_mongoDB_URL
JWT_SECRET=your-production-super-secret-key
CLIENT_URL=https://your-frontend-domain.com

# Frontend
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### 🧪 Testing
```bash
cd backend
npm run seed
```
This will create:-
1 Admin user,
2 Agent users,
10 Leads with various statuses,
5 Customers,
Sample tasks & activities
