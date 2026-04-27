# 15SW Officer Tracking System - Development Branch

## 📋 Overview

This is the **development branch** for the 15th Strike Wing Officer and Pilot Career Development Program. This branch is for testing and validation purposes only.

## 🗄️ Database Status

- **Production Database**: `officer_tracking_new` (182 officers, 1000+ assignments)
- **Development Database**: `officer_tracking_dev` (cloned from production on 2026-04-27)
- ✅ The dev database is an **exact clone** of production data
- ✅ All tables, relationships, and constraints are preserved

## 🔧 Current Configuration

### Backend (Django + PostgreSQL)
- Runs on port `8000`
- Connected to dev database: `officer_tracking_dev`
- CORS configured to accept requests from all network devices

### Frontend (React + Vite)
- Runs on port `5173`
- Served on host `0.0.0.0` (accessible via network)
- API calls use environment variable `VITE_API_URL`

## 🌐 Access for Testing

### Local Access
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`
- Admin Panel: `http://localhost:8000/admin`

### Network Access (Other devices on same network)
- Frontend: `http://[YOUR_IP]:5173`
- Backend API: `http://[YOUR_IP]:8000/api`

**Current Server IP:** `192.168.0.225`

## 🔑 Test Credentials

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| Super Admin | `stalindaj` | `admin123` | Full access, can approve requests |
| Admin | `admin_user` | `Admin123!` | Can create requests, view data |
| Operations | `operations` | `Operations123!` | Read-only access |

## 🚀 Running the Application

### Start Backend
```bash
cd backend
DB_NAME=officer_tracking_dev docker-compose up -d