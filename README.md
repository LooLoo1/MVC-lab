# Group Project Management System

A web application for managing group projects built with Node.js, Express.js, MongoDB, and EJS.

## Features

- User authentication (register, login, logout)
- Create, read, update, and delete projects
- Add team members to projects
- Track project progress with status updates
- Add progress logs with timestamps
- Responsive design with Bootstrap 5

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/project-management
SESSION_SECRET=your-super-secret-key-change-this-in-production
```

4. Start MongoDB:
```bash
mongod
```

5. Start the application:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── public/         # Static files
│   ├── css/       # Stylesheets
│   └── js/        # Client-side JavaScript
├── routes/         # Route definitions
├── views/          # EJS templates
│   ├── partials/  # Reusable view components
│   ├── projects/  # Project-related views
│   └── users/     # User-related views
└── app.js         # Application entry point
```

## Usage

1. Register a new account or login with existing credentials
2. Create a new project with title and description
3. Add team members by their email addresses
4. Update project status and add progress logs
5. View all projects and their details
6. Manage your profile and project memberships

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- EJS templating engine
- Bootstrap 5
- Express Session
- bcryptjs for password hashing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 