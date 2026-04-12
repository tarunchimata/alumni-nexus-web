# 🚀 Local Setup Guide - Alumni Nexus Web

## 📋 Overview
This guide will help you run the **Alumni Nexus Web** platform locally on your system. The platform consists of:
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Authentication**: Keycloak OAuth2
- **Database**: PostgreSQL

---

## 🔧 Required Resources

### **System Requirements**
- **Node.js**: v18 or higher
- **npm**: v8 or higher (or yarn)
- **PostgreSQL**: v13 or higher (or Docker)
- **Docker**: v20 or higher (recommended for easy setup)
- **Git**: Latest version

### **External Services**
- **PostgreSQL Database**: Either local instance or cloud
- **Keycloak Server**: For authentication (use provided instance or self-host)

---

## 🏗️ Setup Options

### **Option 1: Docker (Recommended) 🐳**

#### **Step 1: Clone Repository**
```bash
git clone https://github.com/tarunchimata/alumni-nexus-web.git
cd alumni-nexus-web
```

#### **Step 2: Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
# Database Configuration
DB_HOST=localhost                    # or your PostgreSQL host
DB_PORT=5432
DB_NAME=alumni_nexus_db
DB_USER=postgres
DB_PASSWORD=your_password

# Keycloak Configuration
KEYCLOAK_URL=https://login.hostingmanager.in
KEYCLOAK_REALM=myschoolbuddies-realm
KEYCLOAK_CLIENT_ID=myschoolbuddies-client

# Frontend Configuration
VITE_API_URL=http://localhost:3033/api
VITE_KEYCLOAK_URL=https://login.hostingmanager.in
VITE_KEYCLOAK_REALM=myschoolbuddies-realm
VITE_KEYCLOAK_CLIENT_ID=myschoolbuddies-client

# Optional: SendGrid for emails
SENDGRID_API_KEY=your_sendgrid_key
```

#### **Step 3: Run with Docker**
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

#### **Step 4: Access Applications**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3033
- **API Health Check**: http://localhost:3033/api/health

---

### **Option 2: Manual Setup (Development) 💻**

#### **Step 1: Clone Repository**
```bash
git clone https://github.com/tarunchimata/alumni-nexus-web.git
cd alumni-nexus-web
```

#### **Step 2: Setup Backend**
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Setup environment
cp ../.env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma db push

# Start backend in development
npm run dev
```

#### **Step 3: Setup Frontend**
```bash
# Open new terminal
cd ..

# Navigate to frontend
# (root directory is frontend)

# Install dependencies
npm install

# Start frontend in development
npm run dev
```

---

## 🗄️ Database Setup

### **Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb alumni_nexus_db

# Create user
sudo -u postgres createuser --interactive

# Connect and setup
psql -U postgres -d alumni_nexus_db
```

### **Option B: Docker PostgreSQL**
```bash
# Run PostgreSQL container
docker run --name postgres-alumni \
  -e POSTGRES_DB=alumni_nexus_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# Or use docker-compose
docker-compose up postgres -d
```

---

## 🔐 Keycloak Setup

### **Using Provided Instance (Recommended)**
The project is configured to use:
- **URL**: https://login.hostingmanager.in
- **Realm**: myschoolbuddies-realm
- **Client**: myschoolbuddies-client

### **Self-Hosted Keycloak**
```bash
# Run Keycloak with Docker
docker run --name keycloak \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin123 \
  -p 8080:8080 \
  -d quay.io/keycloak/keycloak:23.0.0

# Update environment variables
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=myschoolbuddies-realm
```

---

## 🚀 Running the Application

### **Development Mode**
```bash
# Frontend (Terminal 1)
npm run dev
# → http://localhost:5173

# Backend (Terminal 2)
cd backend && npm run dev
# → http://localhost:3033
```

### **Production Mode (Docker)**
```bash
docker-compose up --build
# → Frontend: http://localhost:8080
# → Backend: http://localhost:3033
```

---

## 🧪 Testing & Verification

### **Health Checks**
```bash
# Backend health
curl http://localhost:3033/api/health

# Frontend accessibility
curl http://localhost:8080/health
```

### **Test Accounts**
You can create test accounts through:
1. **Registration**: http://localhost:8080/register
2. **Login**: http://localhost:8080/login
3. **Dashboard**: http://localhost:8080/dashboard

### **Available Roles for Testing**
- `student` - Student dashboard
- `teacher` - Teacher dashboard  
- `alumni` - Alumni dashboard
- `school_admin` - School admin dashboard
- `platform_admin` - Platform admin dashboard

---

## 🔧 Common Issues & Solutions

### **Issue: Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -d alumni_nexus_db
```

### **Issue: Port Already in Use**
```bash
# Find process using port
lsof -i :5173  # Frontend
lsof -i :3033  # Backend

# Kill process
kill -9 <PID>
```

### **Issue: Keycloak Connection Error**
```bash
# Test Keycloak accessibility
curl https://login.hostingmanager.in/realms/myschoolbuddies-realm/.well-known/openid_configuration

# Check environment variables
cat .env | grep KEYCLOAK
```

### **Issue: CORS Errors**
```bash
# Check backend CORS configuration
# Ensure your frontend URL is allowed in backend/src/index.ts
```

---

## 📱 Access Points

### **Development**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3033/api
- **Keycloak**: https://login.hostingmanager.in

### **Production (Docker)**
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3033/api
- **Keycloak**: https://login.hostingmanager.in

---

## 🛠️ Development Workflow

### **Making Changes**
```bash
# Frontend changes
# Edit files in src/
# Hot reload automatically updates

# Backend changes  
# Edit files in backend/src/
# Restart backend: npm run dev
```

### **Database Changes**
```bash
# Edit Prisma schema
vim backend/prisma/schema.prisma

# Apply changes
cd backend && npx prisma db push
```

---

## 📚 Useful Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
npm run dev          # Start development server
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations

# Docker
docker-compose up -d           # Start in background
docker-compose down           # Stop services
docker-compose logs -f         # View logs
```

---

## 🆘 Support

### **Getting Help**
- **Issues**: Create on GitHub repository
- **Documentation**: Check README.md and EXECUTION_PLAN.md
- **Logs**: Check browser console and backend logs

### **Quick Test**
```bash
# Test everything is working
curl http://localhost:3033/api/health && echo "✅ Backend OK"
curl http://localhost:5173 && echo "✅ Frontend OK"
```

---

## 🎉 Success!

You should now have the **Alumni Nexus Web** platform running locally with:
- ✅ **Frontend**: React application with role-based dashboards
- ✅ **Backend**: RESTful API with real database integration  
- ✅ **Authentication**: Keycloak OAuth2 integration
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Real Data**: No mock data - fully functional platform

**Ready for development and testing!** 🚀
