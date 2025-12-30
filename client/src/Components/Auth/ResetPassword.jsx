import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../../Context/ChatConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, resetPasswordStep2Schema } from '../../utils/validationSchemas';

const ResetPassword = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm({
        resolver: zodResolver(resetPasswordSchema),
    });
    const { register: registerStep2, handleSubmit: handleSubmitStep2, formState: { errors: errorsStep2 } } = useForm({
        resolver: zodResolver(resetPasswordStep2Schema),
    });

    const [email, setEmail] = useState('');

    const navigate = useNavigate();
    const { setUser } = ChatState();

    const onStep1Submit = async (data) => {
        setLoading(true);
        const { email: inputEmail } = data;

        try {
            const config = { headers: { 'Content-type': 'application/json' } };
            const { data: responseData } = await axios.post('/api/user/forgotpassword', { email: inputEmail }, config);

            setEmail(inputEmail);
            setStep(2);
            setLoading(false);
            toast.success(responseData.message);
        } catch (error) {
            toast.error(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
            setLoading(false);
        }
    };

    const onStep2Submit = async (data) => {
        setLoading(true);
        const { otp, password } = data;

        try {
            const config = {
                headers: { 'Content-type': 'application/json' },
            };

            const { data: responseData } = await axios.put(
                '/api/user/resetpassword',
                { email, otp, password },
                config
            );

            toast.success(responseData.message);
            setUser(responseData);
            setLoading(false);
            navigate('/chats');
        } catch (error) {
            toast.error(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center p-4 relative overflow-hidden'>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/20 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000"></div>

            <div className='glass w-full max-w-lg rounded-2xl overflow-hidden relative z-10'>
                <div className='p-6 md:p-8 text-center border-b border-white/10 bg-white/5'>
                    <h1 className='text-5xl font-display font-bold text-gradient tracking-wider mb-2 drop-shadow-lg'>
                        ConnecT
                    </h1>
                    <p className='text-gray-300 font-light tracking-widest text-sm uppercase'>
                        {step === 1 ? 'Recover Your Account' : 'Set New Password'}
                    </p>
                </div>

                <div className='p-8'>
                    {step === 1 ? (
                        <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-6 animate-fade-in">
                            <div className='space-y-2'>
                                <label className='block text-xs font-bold text-neon-blue uppercase tracking-wider'>Email Address</label>
                                <input
                                    type='email'
                                    placeholder='Enter your email'
                                    className={`w-full px-4 py-3 rounded-lg bg-dark-surface/50 border ${errorsStep1.email ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all outline-none`}
                                    {...registerStep1("email")}
                                />
                                {errorsStep1.email && <p className="text-red-500 text-xs">{errorsStep1.email.message}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-lg font-bold text-lg tracking-wide shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.5)] transition-all duration-300 ${loading
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                                    }`}
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="w-full text-gray-400 hover:text-white text-sm mt-2 transition-colors"
                            >
                                Back to Login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitStep2(onStep2Submit)} className="space-y-6 animate-fade-in-up">
                            <div className='space-y-2'>
                                <label className='block text-xs font-bold text-neon-blue uppercase tracking-wider'>OTP Code</label>
                                <input
                                    type='text'
                                    placeholder='Enter 6-digit OTP'
                                    className={`w-full px-4 py-3 rounded-lg bg-dark-surface/50 border ${errorsStep2.otp ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all outline-none text-center text-xl tracking-widest font-display`}
                                    {...registerStep2("otp")}
                                    maxLength={6}
                                />
                                {errorsStep2.otp && <p className="text-red-500 text-xs">{errorsStep2.otp.message}</p>}
                            </div>
                            <div className='space-y-2'>
                                <label className='block text-xs font-bold text-neon-blue uppercase tracking-wider'>New Password</label>
                                <input
                                    type='password'
                                    placeholder='Enter new password'
                                    className={`w-full px-4 py-3 rounded-lg bg-dark-surface/50 border ${errorsStep2.password ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all outline-none`}
                                    {...registerStep2("password")}
                                />
                                {errorsStep2.password && <p className="text-red-500 text-xs">{errorsStep2.password.message}</p>}
                            </div>
                            <div className='space-y-2'>
                                <label className='block text-xs font-bold text-neon-blue uppercase tracking-wider'>Confirm Password</label>
                                <input
                                    type='password'
                                    placeholder='Confirm new password'
                                    className={`w-full px-4 py-3 rounded-lg bg-dark-surface/50 border ${errorsStep2.confirmPassword ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all outline-none`}
                                    {...registerStep2("confirmPassword")}
                                />
                                {errorsStep2.confirmPassword && <p className="text-red-500 text-xs">{errorsStep2.confirmPassword.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-lg font-bold text-lg tracking-wide shadow-[0_0_15px_rgba(72,187,120,0.3)] hover:shadow-[0_0_25px_rgba(72,187,120,0.5)] transition-all duration-300 ${loading
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                    }`}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-gray-400 hover:text-white text-sm mt-2 transition-colors"
                            >
                                Back to Email
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
