# Mern-Pingup
# 🚀 PingUp - Full Stack Social Media Platform

A modern **full-stack social media application** built with the **MERN Stack** that enables users to connect, share posts and stories, chat in real time, and manage their profiles securely.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 Overview

PingUp is a feature-rich social networking platform where users can:

- 🔐 Authenticate securely
- 📝 Create posts with images
- 📸 Share stories
- 👥 Follow and connect with users
- 💬 Chat in real time
- 🔍 Discover new people
- 👤 Customize profiles

The project demonstrates modern full-stack web development using React, Node.js, Express, MongoDB, Clerk Authentication, ImageKit, and Inngest.

---

# ✨ Features

### 🔑 Authentication

- Google Sign-In
- Email Sign-Up
- Secure authentication with Clerk
- Multi-session support
- Account switching

---

### 👤 User Profile

- Edit profile
- Upload profile picture
- Upload cover image
- Update bio
- Change username
- Update location
- Delete account

---

### 📰 Feed

- Personalized news feed
- View posts from connected users
- Responsive layout
- Infinite feed structure

---

### 📸 Stories

- Create text stories
- Upload image stories
- Upload video stories
- Auto-expiring story viewer
- Progress indicator

---

### 📝 Posts

- Create new posts
- Upload multiple images
- Caption support
- Responsive post cards

---

### 👥 Connections

- Follow users
- Send connection requests
- Accept requests
- Followers & Following lists

---

### 💬 Real-Time Chat

- One-to-one messaging
- Image sharing
- Recent conversations
- Connected users only

---

### 🔍 Discover Users

Search users by:

- Name
- Email
- Location

---

## 🛠 Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router DOM
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication

- Clerk

### Image Storage

- ImageKit

### Background Jobs

- Inngest

### Deployment

- Vercel

---

# 📂 Project Structure

```
PingUp/
│
├── client/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── public/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── README.md
└── package.json
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/pingup.git
```

```bash
cd pingup
```

---

## Install Frontend

```bash
cd client
npm install
```

---

## Install Backend

```bash
cd ../server
npm install
```

---

## Environment Variables

Create a `.env` file inside the server directory.

```env
MONGODB_URI=your_mongodb_connection

CLERK_SECRET_KEY=your_clerk_secret

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

IMAGEKIT_PUBLIC_KEY=your_imagekit_public

IMAGEKIT_PRIVATE_KEY=your_imagekit_private

IMAGEKIT_URL_ENDPOINT=your_imagekit_endpoint

INNGEST_EVENT_KEY=your_inngest_key
```

---

# ▶️ Run the Project

### Backend

```bash
npm run server
```

### Frontend

```bash
npm run dev
```

---

# 📸 Screenshots

## Login Page

![Login](screenshots/login.png)

---

## Home Feed

![Feed](screenshots/home.png)

---

## Stories

![Stories](screenshots/stories.png)

---

## Chat

![Chat](screenshots/chat.png)

---

## Profile

![Profile](screenshots/profile.png)

---

# 🚀 Future Improvements

- Notifications
- Dark Mode
- Group Chats
- Voice Messages
- Video Calling
- Likes & Comments
- Saved Posts
- Push Notifications
- Mobile App

---

# 📚 Learning Outcomes

This project demonstrates:

- MERN Stack Development
- REST APIs
- Authentication
- React Routing
- State Management
- MongoDB Integration
- Image Uploads
- Real-Time Features
- Responsive UI
- Deployment

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit changes

```bash
git commit -m "Added feature"
```

4. Push changes

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# ⭐ Show Your Support

If you like this project, consider giving it a ⭐ on GitHub!

---

# 📧 Contact

**Your Name**

GitHub: https://github.com/your-username

LinkedIn: https://linkedin.com/in/your-profile

Email: your-email@example.com

---

## 📜 License

This project is licensed under the MIT License.
