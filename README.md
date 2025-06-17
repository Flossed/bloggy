# Bloggy

A modern multi-user blogging platform built with Node.js, Express, and MongoDB.

## Features

- **Multi-user Support**: Multiple users can create and manage their own blogs
- **Authentication**: Secure user registration and login system
- **WYSIWYG Editor**: Rich text editor using Quill.js for creating and formatting blog posts
- **Draft/Published Modes**: Save posts as drafts or publish them for public viewing
- **Version Control**: All changes to articles are versioned with timestamps
- **Analytics**: Track visitor statistics and article ratings
- **User Ratings**: Visitors can like and rate articles (1-10)
- **Email Reports**: Automated email reports of viewer statistics and ratings
- **Admin Panel**: Administrator can manage users and their content
- **Archive System**: Published articles can be archived and hidden from public view

## Technical Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (hosted at 192.168.129.197)
- **Frontend**: EJS templates, Bootstrap 5
- **Editor**: Quill.js WYSIWYG editor
- **Authentication**: Passport.js with local strategy
- **Session Store**: MongoDB session store
- **Email**: Nodemailer for sending analytics reports

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Flossed/bloggy.git
cd bloggy
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
MONGODB_URI=mongodb://192.168.129.197:27017/bloggy
SESSION_SECRET=your-session-secret
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

4. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage

- Visit `http://localhost:3000` to access the application
- Register a new account or login with existing credentials
- Create, edit, and publish blog posts
- View analytics and manage your content
- Admin users have additional privileges to manage all users and content

## License

MIT License - see LICENSE file for details

## Author

Daniel S .A. Khan (c)
