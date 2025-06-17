# Bloggy - Setup Instructions

## GitHub Repository Setup

1. **Create the repository on GitHub**:
   - Go to https://github.com/new
   - Repository name: `bloggy`
   - Description: `A multi-user blogging platform with authentication, wysiwyg editor, and analytics`
   - Set as Public
   - DO NOT initialize with README (we already have one)
   - Click "Create repository"

2. **Initialize Git and push the code**:
   ```bash
   cd E:\_Applications\___Claude\bloggy
   git init
   git add .
   git commit -m "Initial commit - Bloggy platform"
   git branch -M main
   git remote add origin https://github.com/Flossed/bloggy.git
   git push -u origin main
   ```

## Application Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create a `.env` file** in the root directory:
   ```env
   # MongoDB connection
   MONGODB_URI=mongodb://192.168.129.197:27017/bloggy
   
   # Session secret (change this to a secure random string)
   SESSION_SECRET=your-very-secure-session-secret-here-change-this
   
   # Server port
   PORT=3000
   
   # Email Configuration (for analytics reports)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-email-password
   EMAIL_FROM=Bloggy Platform <noreply@bloggy.com>
   
   # Admin credentials (created on first run)
   ADMIN_EMAIL=admin@bloggy.com
   ADMIN_PASSWORD=admin123
   
   # Environment
   NODE_ENV=development
   LOG_LEVEL=info
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Open your browser and go to http://localhost:3000
   - The admin user will be created automatically on first run
   - Login with the admin credentials from your .env file

## Features Overview

### For Users:
- Register and login to create your own blog space
- Write articles using the WYSIWYG editor (Quill.js)
- Save articles as drafts or publish them
- View analytics for your articles (views, likes, ratings)
- Receive email reports about your blog's performance

### For Visitors:
- Browse published articles
- Search for content
- Like articles and rate them (1-10)
- View user blog spaces

### For Administrators:
- Manage users (activate/deactivate accounts)
- Manage articles (archive/unarchive content)
- View platform-wide analytics
- Access detailed statistics

## API Endpoints

- `POST /api/article/:id/like` - Like an article
- `POST /api/article/:id/rate` - Rate an article (1-10)
- `GET /api/search?q=query` - Search articles
- `GET /api/popular` - Get popular articles
- `GET /api/article/:id/stats` - Get article statistics

## Development

- The application uses MongoDB at `192.168.129.197`
- Session data is stored in MongoDB
- File uploads are stored in the `uploads/` directory
- Logs are stored in the `logs/` directory
- Email reports are sent based on user preferences (daily/weekly/monthly)

## Deployment Notes

For production deployment:
1. Set `NODE_ENV=production` in your environment
2. Use a secure `SESSION_SECRET`
3. Configure proper email credentials
4. Set up SSL/TLS certificates
5. Consider using PM2 or similar process manager
6. Set up proper backup strategy for MongoDB
7. Configure appropriate firewall rules

## Troubleshooting

1. **MongoDB connection issues**:
   - Ensure MongoDB is running at `192.168.129.197:27017`
   - Check firewall settings
   - Verify connection string in .env

2. **Email not sending**:
   - Check email credentials in .env
   - Enable "Less secure app access" for Gmail
   - Consider using an app-specific password

3. **File upload issues**:
   - Ensure `uploads/` directory exists and is writable
   - Check file size limits (currently 5MB)

## License

MIT License - see LICENSE file

## Support

For issues and feature requests, please use the GitHub issue tracker at:
https://github.com/Flossed/bloggy/issues
