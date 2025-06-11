# Project Management System

A web application for managing group projects built using Node.js, Express.js, MongoDB, and EJS.

## Project Description
This project is an individual work that implements a project management system using the Model-View-Controller (MVC) pattern with Server-Side Rendering (SSR). The application allows users to manage projects, teams, and tasks in a collaborative environment.

## Features

### Authentication and Authorization
- User registration with data validation
- Login with session management
- Logout with session cleanup
- Route protection against unauthorized access

### Project Management
- Create new projects with title, description, and dates
- Browse project list with filtering and sorting
- Edit project details
- Delete projects (admin only)
- Track project progress
- Project status tracking (planning, in-progress, completed, on-hold)

### Team Management
- Create project teams
- Add/remove team members
- Assign team roles (member, admin)
- Manage member permissions
- Team leader management

### Notifications
- Team invitations
- Project assignments
- Task assignments
- Comments and mentions
- Status updates

### User Interface
- Responsive design for mobile devices
- Intuitive navigation
- Modern appearance
- Accessibility (WCAG 2.1)

## System Requirements

### Required Versions
- Node.js: v22.14.0
- npm: v10.2.4 or higher
- MongoDB: v6.17.0 or higher
- Browser: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

### Hardware Requirements
- CPU: 1.6 GHz or faster
- RAM: minimum 2GB
- Storage: minimum 1GB free space
- Internet connection: minimum 1 Mbps

## Installation

1. Clone the repository:
```bash
git clone https://github.com/LooLoo1/MVC-lab
cd MVC-lab
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
MONGODB_URI=mongodb+srv://vam:123@cluster0.rd5knl1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

4. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`.

## MVC Structure

### Models
- User.js - user model with authentication and profile management
- Project.js - project model with status tracking and progress logs
- Team.js - team model with member management and roles
- Notification.js - notification model for system events

### Controllers
- authController.js - authentication management
- userController.js - user profile and settings management
- projectController.js - project CRUD operations
- teamController.js - team management and member operations
- notificationController.js - notification handling

### Views
- views/users/ - user authentication and profile views
- views/projects/ - project management views
- views/teams/ - team management views
- views/notifications/ - notification views
- views/partials/ - reusable components
- views/layouts/ - page layouts

## Input Data Examples

### User Registration
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Project Creation
```json
{
  "title": "Web Application Development",
  "description": "Development of a new web application",
  "deadline": "2024-06-20",
  "status": "planning"
}
```

### Team Creation
```json
{
  "name": "Development Team",
  "description": "Main development team",
  "members": [
    {
      "user": "userId",
      "role": "member"
    }
  ]
}
```

## External Libraries Used
- express (^5.1.0) - Web framework
- mongoose (^8.15.1) - MongoDB object modeling
- ejs (^3.1.10) - Template engine
- bcryptjs (^3.0.2) - Password hashing
- express-session (^1.18.1) - Session management
- connect-mongo (^5.1.0) - MongoDB session store
- connect-flash (^0.1.1) - Flash messages
- method-override (^3.0.0) - HTTP method override
- morgan (^1.10.0) - HTTP request logger
- dotenv (^16.5.0) - Environment variables
- cookie-parser (^1.4.7) - Cookie parsing