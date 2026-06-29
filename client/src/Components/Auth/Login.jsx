import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChatState } from '../../Context/ChatConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../utils/validationSchemas';
import GoogleAuthButton from './GoogleAuthButton';
import { Mail, Lock, LogIn, KeyRound } from 'lucide-react';

const Login = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const navigate = useNavigate();
    const { setUser } = ChatState();

    const onSubmit = async (data) => {
        setLoading(true);
        const { email, password } = data;

        try {
            const config = {
                headers: { 'Content-type': 'application/json' },
            };

            const { data: responseData } = await axios.post(
                '/api/user/login',
                { email, password },
                config
            );

            setUser(responseData);
            setLoading(false);
            toast.success('Login Successful');
            navigate('/chats');
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.isVerified === false) {
                toast.error(error.response.data.message);
                setSubmittedEmail(email);
                setShowOtpInput(true);
                setLoading(false);
                return;
            }

            toast.error(
                'Error Occured: ' +
                (error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message)
            );
            setLoading(false);
        }
    };

    const verifyOtpHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (!otp) {
            toast.warning("Please enter OTP");
            setLoading(false);
            return;
        }

        try {
            const config = { headers: { 'Content-type': 'application/json' } };
            const { data } = await axios.post('/api/user/verify-otp', { email: submittedEmail, otp }, config);

            setUser(data);
            setLoading(false);
            navigate('/chats');
            toast.success('Login Successful');
        } catch (error) {
            toast.error('Verification Failed: ' + (error.response && error.response.data.message ? error.response.data.message : error.message));
            setLoading(false);
        }
    };

    const labelClasses = "block text-xs font-bold text-neon-blue/90 uppercase tracking-wider mb-1";

    return (
        <div className='space-y-6 animate-fade-in'>
            {!showOtpInput ? (
                <div className='space-y-5'>
                    <GoogleAuthButton isSignup={false} />
                    
                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                        {/* Email Input */}
                        <div className='space-y-1'>
                            <label className={labelClasses}>Email Address</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                <input
                                    type='email'
                                    placeholder='john@example.com'
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errors.email ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/30 transition-all outline-none text-sm`}
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password Input */}
                        <div className='space-y-1'>
                            <div className="flex items-center justify-between">
                                <label className={labelClasses}>Password</label>
                                <Link
                                    to="/resetpassword"
                                    className='text-xs text-gray-400 hover:text-neon-blue transition-colors flex items-center gap-1 mb-1'
                                >
                                    <KeyRound className="w-3 h-3" />
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                <input
                                    type='password'
                                    placeholder='••••••••'
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errors.password ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/30 transition-all outline-none text-sm`}
                                    {...register("password")}
                                />
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-base tracking-wider shadow-[0_0_20px_rgba(0,243,255,0.35)] hover:shadow-[0_0_30px_rgba(0,243,255,0.65)] transition-all duration-300 flex items-center justify-center gap-2 ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white hover:scale-[1.01]'
                                }`}
                        >
                            {loading ? (
                                'Authenticating...'
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    <span>Sign In to Account</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="text-center">
                        <h3 className="text-lg font-display text-white">Enter Verification Code</h3>
                        <p className="text-gray-400 text-sm">We sent a newly generated 6-digit code to {submittedEmail}</p>
                    </div>
                    <div className='space-y-2'>
                        <input
                            type='text' placeholder='Enter 6-digit OTP'
                            className='w-full px-4 py-3 rounded-lg bg-dark-surface/50 border border-white/10 text-white placeholder-gray-500 focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all outline-none text-center text-2xl tracking-[0.5em] font-display'
                            onChange={(e) => setOtp(e.target.value)} value={otp} maxLength={6}
                        />
                    </div>
                    <button
                        onClick={verifyOtpHandler}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-lg tracking-wide shadow-[0_0_15px_rgba(72,187,120,0.3)] hover:shadow-[0_0_25px_rgba(72,187,120,0.5)] transition-all duration-300 ${loading
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                            }`}
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                        onClick={() => setShowOtpInput(false)}
                        className="w-full text-gray-400 hover:text-white text-sm mt-2"
                    >
                        Back to Login
                    </button>
                </div>
            )}
        </div>
    );
};

export default Login;
