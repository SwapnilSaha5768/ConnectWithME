import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../../Context/ChatConfig';

const GoogleAuthButton = ({ isSignup = false }) => {
    const navigate = useNavigate();
    const { setUser } = ChatState();
    const [loading, setLoading] = useState(false);

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                // Use native fetch to avoid axios baseURL & withCredentials global interceptors
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });

                if (!res.ok) {
                    throw new Error(`Google UserInfo API responded with status ${res.status}`);
                }

                const googleUser = await res.json();
                const { email, name, picture, sub } = googleUser;

                // Authenticate / Register with backend API
                const { data } = await axios.post('/api/user/google', {
                    email,
                    name,
                    picture,
                    googleId: sub,
                    token: tokenResponse.access_token,
                });

                localStorage.setItem('userInfo', JSON.stringify(data));
                setUser(data);
                toast.success(isSignup ? 'Registered & logged in with Google!' : 'Login Successful!');
                navigate('/chats');
            } catch (error) {
                console.error('Google Auth Error Details:', error);
                const msg = error.response?.data?.message || error.message || 'Google authentication failed';
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        },
        onError: (error) => {
            console.error('Google Login Popup Error:', error);
            toast.error('Google Sign In failed or popup was closed.');
        },
    });

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-4">
            <button
                type="button"
                onClick={() => loginWithGoogle()}
                disabled={loading}
                className="w-full relative py-3 px-4 rounded-xl font-medium text-sm text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 flex items-center justify-center gap-3 group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                </svg>

                <span className="relative z-10 tracking-wide">
                    {loading ? 'Connecting to Google...' : (isSignup ? 'Sign up with Google' : 'Sign in with Google')}
                </span>
            </button>

            <div className="w-full flex items-center justify-center my-1">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="px-3 text-xs text-gray-400 font-medium uppercase tracking-widest text-[11px]">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>
        </div>
    );
};

export default GoogleAuthButton;
