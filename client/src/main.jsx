import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axios from 'axios'

const isProduction = window.location.hostname.includes('vercel.app');
axios.defaults.baseURL = isProduction ? '' : (import.meta.env.VITE_SERVER_URL || '');
axios.defaults.withCredentials = true;

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1082987545938-placeholder.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={googleClientId}>
            <App />
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
