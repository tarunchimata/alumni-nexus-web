
# My School Buddies

A comprehensive web platform connecting students, teachers, alumni, and school administrators in a unified school community ecosystem.

## 🌟 Features

- **Multi-Role Authentication**: Support for students, teachers, alumni, school admins, and platform administrators
- **Class Groups & Messaging**: Real-time communication within class groups
- **School Management**: Complete CRUD operations for schools and users
- **Alumni Network**: Connect current students with graduates
- **Role-Based Dashboards**: Tailored experiences for each user type
- **Bulk Operations**: CSV upload for schools and users
- **Secure Authentication**: Integrated with Keycloak for enterprise-grade security

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** component library
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Lucide React** for icons

### Backend Integration Points
- **Keycloak** for authentication and authorization
- **PostgreSQL** for data persistence
- **SendGrid** for email notifications
- **RESTful APIs** for all data operations

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/UI components
│   └── AuthGuard.tsx   # Authentication wrapper
├── hooks/              # Custom React hooks
│   └── useAuth.tsx     # Authentication context
├── lib/                # Utility libraries
│   ├── api.ts          # API client configuration
│   ├── keycloak.ts     # Keycloak integration
│   └── utils.ts        # Common utilities
├── pages/              # Application pages
│   ├── Index.tsx       # Landing page
│   ├── Login.tsx       # Authentication page
│   ├── Register.tsx    # User registration
│   └── Dashboard.tsx   # Main dashboard
└── App.tsx             # Root application component
```

## 🔧 Configuration

### Environment Variables

The application expects these environment variables for full backend integration:

```env
# PostgreSQL Database
DB_HOST=pg.hostingmanager.in
DB_PORT=5432
DB_NAME=myschoolbuddies_budibase_db
DB_USER=msbfinalroot
DB_PASSWORD=vA5ZXB2Nb6M3P22GWZRch999

# Keycloak Authentication
KEYCLOAK_URL=https://login.hostingmanager.in
KEYCLOAK_REALM=myschoolbuddies-realm
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=S@feAdminKeycloak!2025

# SendGrid Email Service
SENDGRID_API_KEY=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
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-school-buddies
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

## 🎯 User Roles & Permissions

### Platform Administrator
- Manage all schools and users
- View system-wide analytics
- Configure global settings
- Access to admin dashboard

### School Administrator  
- Manage school-specific users and classes
- View school analytics
- Configure school settings
- Moderate school content

### Teacher
- Manage assigned classes
- Moderate class group chats
- View student information
- Send announcements

### Student
- Join class groups
- Participate in discussions
- Connect with classmates
- Access learning resources

### Alumni
- Connect with current students
- Join alumni networks
- Mentor current students
- Participate in school events

## 🔐 Authentication Flow

The application uses Keycloak for authentication:

1. **User Registration**: New users register with school code validation
2. **Role Assignment**: Users are assigned roles based on their relationship to the school
3. **Token Management**: JWT tokens manage session state
4. **Role-Based Access**: Different UI experiences based on user roles

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)  
- Mobile phones (320px - 767px)

## 🔌 API Integration Points

The frontend is designed to integrate with these backend services:

### Authentication API
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Schools API
- `GET /api/schools` - List schools
- `POST /api/schools` - Create school
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school

### Users API  
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Messages API
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `GET /api/messages/groups` - Get group conversations

## 🎨 Design System

The application uses a cohesive design system:

### Colors
- **Primary**: Blue gradient (blue-500 to purple-600)
- **Secondary**: Orange accents (orange-400 to pink-500)
- **Success**: Green (green-500)
- **Warning**: Yellow (yellow-500)
- **Error**: Red (red-500)

### Typography
- **Headings**: Inter font, bold weights
- **Body**: Inter font, regular weights
- **Code**: Mono font family

### Spacing
- Consistent 4px grid system
- Tailwind CSS spacing utilities

## 🚀 Deployment

### Frontend Deployment
The React application can be deployed to:
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Production Build
```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## 🔍 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for version control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🔮 Future Enhancements

- Real-time notifications
- File sharing capabilities
- Video calling integration
- Mobile app development
- Advanced analytics dashboard
- Multi-language support

---

**My School Buddies** - Connecting school communities, one relationship at a time. 🎓✨
