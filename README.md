# ConnecT - Real-time MERN Chat Application

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![Mongoose](https://img.shields.io/badge/mongoose-9.x-red.svg)

**ConnecT** is a robust and feature-rich real-time chat application built using the MERN stack (MongoDB, Express.js, React, Node.js). It offers seamless messaging, group chats, and real-time audio calling capabilities, wrapped in a modern, responsive user interface.

## 🚀 Features

-   **Real-time Messaging**: Instant messaging powered by Socket.io.
-   **Secure Authentication**: JWT-based auth with HttpOnly cookies for enhanced security.
-   **Group Chats**: Create and manage group conversations effortlessly.
-   **Audio Calls**: Peer-to-peer calling functionality using WebRTC (Simple Peer).
-   **Profile Management**: Update user profiles with image cropping support.
-   **Multimedia Support**: Share images and attachments.
-   **Notifications**: Real-time notifications for new messages.
-   **Security**: Implemented rate limiting, data sanitization, and secure headers (Helmet).
-   **Responsive Design**: Mobile-friendly interface built with TailwindCSS.

## 🛠️ Tech Stack

### Client
-   **Framework**: React (Vite)
-   **Styling**: TailwindCSS, HeadlessUI, Framer Motion
-   **State Management**: Context API
-   **Routing**: React Router DOM
-   **Real-time**: Socket.io Client, Simple Peer
-   **HTTP Client**: Axios
-   **Icons**: Lucide React

### Server
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (Mongoose Schema)
-   **Authentication**: JSON Web Token (JWT), BCryptJS
-   **Real-time**: Socket.io
-   **Security**: Helmet, Express Rate Limit, Mongo Sanitize
-   **Email Service**: Nodemailer

## ⚙️ Installation & Setup

Prerequisites: Ensure you have **Node.js** and **MongoDB** installed on your machine.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/SwapnilSaha5768/connectwithme.git
    cd ConnecT
    ```

2.  **Install Dependencies**
    You can install dependencies for both server and client using the root script:
    ```bash
    npm run install-all
    ```
    *Alternatively, install them separately:*
    ```bash
    # Server
    cd server
    npm install
    
    # Client
    cd ../client
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the `server` directory and configure the following:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    NODE_ENV=development
    CLIENT_URL=http://localhost:5173
    SMTP_USER = your_smtp_user  
    SMTP_PASS = your_smtp_pass
    EMAIL_USER = your_email_user
    ```

    Create a `.env` file in the `client` directory if needed (e.g., for API base URL):
    ```env
    VITE_IMGBB_API_KEY=your_imgbb_api_key
    ```

4.  **Run the Application**
    From the root directory, start both client and server concurrently:
    ```bash
    npm run dev
    ```
    Or run them separately:
    ```bash
    npm run server # Starts backend
    npm run client # Starts frontend
    ```

## 📂 Project Structure

```
ConnecT/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── content/        # Contexts (Chat, Auth)
│   │   ├── pages/          # Application pages (Chat, Auth)
│   │   └── ...
│   ├── public/
│   └── ...
├── server/                 # Express Backend
│   ├── config/             # DB and other configs
│   ├── controllers/        # Route logic
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── ...
└── package.json            # Root configuration
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the [ISC License](LICENSE).

---
*Created by Swapnil Saha*
