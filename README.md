# Messaging App

A full-stack messaging application built with Node.js, Express, React, and SQLite. Users can sign up with a username, send messages to other users, and view their inbox and sent messages.

## Features

- **User Authentication**: Secure signup and login with username/password
- **Message System**: Send messages to other users by username
- **Inbox**: View received messages with read/unread status
- **Sent Messages**: View all messages you've sent
- **Real-time Updates**: Messages are marked as read when viewed
- **Responsive Design**: Works on desktop and mobile devices
- **Session Management**: Stay logged in across browser sessions

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite** - Database
- **bcrypt** - Password hashing
- **express-session** - Session management
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client

## Project Structure

```
mailing_app/
├── backend/                 # Backend server code
│   ├── routes/             # API route handlers
│   │   ├── auth.js         # Authentication endpoints
│   │   └── messages.js     # Message endpoints
│   ├── middleware/         # Custom middleware
│   │   └── auth.js         # Authentication middleware
│   ├── database.js         # Database connection and queries
│   ├── server.js           # Express server setup
│   ├── package.json        # Backend dependencies
│   └── env.example         # Environment variables template
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── api/            # API client functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # App entry point
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # Tailwind configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mailing_app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd ../backend
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```
   SESSION_SECRET=your-super-secret-session-key-here
   PORT=3001
   DB_PATH=./database.sqlite
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173` to use the application

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/check` - Check authentication status

### Messages
- `POST /api/messages/send` - Send a message
- `GET /api/messages/inbox` - Get received messages
- `GET /api/messages/sent` - Get sent messages
- `GET /api/messages/:id` - Get specific message
- `PUT /api/messages/:id/read` - Mark message as read

### Health
- `GET /api/health` - Server health check

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_username TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT 0,
  FOREIGN KEY (from_user_id) REFERENCES users (id)
);
```

## Usage

1. **Sign Up**: Create a new account with a unique username
2. **Login**: Sign in with your username and password
3. **Send Messages**: Use the Compose page to send messages to other users
4. **View Inbox**: Check received messages in your inbox
5. **View Sent**: See all messages you've sent
6. **Reply**: Click reply on any message to compose a response

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt
- **Session Management**: Secure session cookies with httpOnly flag
- **Input Validation**: Both client and server-side validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Protection against brute force attacks

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite development server with hot reload
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## Environment Variables

### Backend (.env)
- `SESSION_SECRET` - Secret key for session encryption
- `PORT` - Server port (default: 3001)
- `DB_PATH` - SQLite database file path
- `NODE_ENV` - Environment (development/production)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)

## Best Practices Implemented

1. **Separation of Concerns**: Clear separation between frontend, backend, and database
2. **Secure Authentication**: Password hashing and session management
3. **Input Validation**: Client and server-side validation
4. **Error Handling**: Comprehensive error handling and user feedback
5. **RESTful API**: Clean, predictable API endpoints
6. **Component Architecture**: Reusable React components
7. **Responsive Design**: Mobile-first approach with Tailwind CSS
8. **Code Organization**: Clear folder structure and naming conventions

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the PORT in backend/.env file
   - Or kill the process using the port

2. **Database connection errors**
   - Ensure SQLite is properly installed
   - Check file permissions for database directory

3. **CORS errors**
   - Verify frontend URL is in backend CORS configuration
   - Check that frontend is running on the expected port

4. **Session not persisting**
   - Ensure cookies are enabled in browser
   - Check that withCredentials is set to true in axios

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- Real-time messaging with WebSockets
- Message search functionality
- File attachments
- Message threading
- Push notifications
- User profiles and avatars
- Message encryption
- Admin panel
- Message archiving
- Bulk operations

