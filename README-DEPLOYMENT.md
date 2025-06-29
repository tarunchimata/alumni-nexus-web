
# My School Buddies Platform - Deployment Guide

## Quick Start with Docker

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd myschoolbuddies
   cp .env.example .env
   ```

2. **Configure Environment**
   Edit `.env` file with your settings (database, Keycloak, SendGrid are pre-configured)

3. **Setup Database**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   ```

4. **Build and Run**
   ```bash
   cd docker
   docker-compose up --build
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost/health

## Architecture

- **Frontend**: React + TypeScript + Vite + Nginx
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL (hosted at pg.hostingmanager.in)
- **Authentication**: Keycloak (hosted at login.hostingmanager.in)
- **Email**: SendGrid
- **Deployment**: Docker + Docker Compose

## Services Integration

### PostgreSQL Database
- **Host**: pg.hostingmanager.in:5432
- **Database**: myschoolbuddies_budibase_db
- **User**: msbfinalroot
- **Connection**: Automatic via Prisma ORM

### Keycloak Authentication
- **URL**: https://login.hostingmanager.in
- **Realm**: myschoolbuddies-realm
- **Frontend Client**: frontend-client
- **Backend Client**: backend-client

### SendGrid Email
- **API Key**: Pre-configured
- **From Email**: noreply@myschoolbuddies.com
- **Templates**: Welcome, password reset, notifications

## Features Implemented

### Backend API
- ✅ Keycloak JWT authentication
- ✅ Role-based authorization (5 roles)
- ✅ PostgreSQL integration with Prisma
- ✅ Schools CRUD with UDISE validation
- ✅ Users management with Keycloak sync
- ✅ CSV bulk import for schools/users
- ✅ SendGrid email integration
- ✅ Rate limiting and security headers

### Frontend Application
- ✅ Real Keycloak PKCE authentication
- ✅ React Query for API state management
- ✅ Role-based dashboard routing
- ✅ CSV import interface
- ✅ Responsive UI with shadcn/ui
- ✅ Error handling and loading states

### Docker Deployment
- ✅ Multi-stage optimized builds
- ✅ Nginx reverse proxy
- ✅ Health checks and auto-restart
- ✅ Production-ready security headers
- ✅ Volume mounts for logs/uploads

## User Roles & Access

1. **Platform Admin**: Full system access, school management
2. **School Admin**: School-specific management
3. **Teacher**: Class and student management
4. **Student**: Class participation and messaging
5. **Alumni**: Community access and messaging

## CSV Import Templates

Located in `/templates/`:
- `schools-template.csv` - School bulk import format
- `users-template.csv` - User bulk import format

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
npm install
npm run dev
```

## Production Deployment

1. **Update Environment Variables** for production
2. **SSL Configuration** in nginx.conf
3. **Database Migrations** via Prisma
4. **Domain Configuration** for CORS
5. **Monitoring Setup** for logs and health

## Troubleshooting

### Common Issues
- **Database Connection**: Check PostgreSQL credentials
- **Keycloak Auth**: Verify realm and client configuration
- **Email Sending**: Confirm SendGrid API key
- **File Uploads**: Check upload directory permissions

### Health Checks
- Backend: http://localhost:3001/health
- Frontend: http://localhost:3000/health
- Full Stack: http://localhost/health

### Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

## Next Steps

1. **Production SSL** setup with Let's Encrypt
2. **Real-time Messaging** with WebSocket
3. **Advanced Analytics** dashboard
4. **Mobile App** development
5. **Integration Testing** suite

---

🎉 **Your complete My School Buddies platform is now ready for production!**
