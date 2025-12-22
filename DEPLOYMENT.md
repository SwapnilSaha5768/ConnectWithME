# Deployment Guide

Since this app uses Socket.io (Real-time communication), the backend **cannot** run on Vercel's standard serverless functions.
We will deploy the **Backend to Render** and **Frontend to Vercel**.

## 1. Backend Deployment (Render)

1.  Push your code to GitHub.
2.  Go to [Render.com](https://render.com/) and create a "New Web Service".
3.  Connect your GitHub repository.
4.  **Root Directory**: `server`
5.  **Build Command**: `npm install`
6.  **Start Command**: `node index.js`
7.  **Environment Variables**:
    *   `PORT`: `5000` (or leave empty, Render assigns one automatically)
    *   `MONGO_URI`: Your MongoDB Atlas Connection String.
    *   `JWT_SECRET`: A secret random string.
    *   `EMAIL_USER` / `EMAIL_PASS`: For OTP emails.
    *   `BASE_URL`: The Frontend URL (you will get this after Step 2, update it later).
8.  Deploy!
9.  **Copy the Backend URL** (e.g., `https://connect-api.onrender.com`).

## 2. Frontend Deployment (Vercel)

1.  Go to [Vercel.com](https://vercel.com/) and "Add New Project".
2.  Select the same GitHub repository.
3.  **Root Directory**: Edit this and select `client`.
4.  **Environment Variables**:
    *   `VITE_SERVER_URL`: Paste the **Backend URL** from Render (e.g., `https://connect-api.onrender.com`).
5.  Deploy!
6.  **Copy the Application URL**.

## 3. Final Connection

1.  Go back to **Render** -> Environment Variables.
2.  Update `BASE_URL` with your **Frontend URL** (for email verification links).
3.  Update your `cors` options in `server/index.js` if necessary (allow the specific frontend domain).
