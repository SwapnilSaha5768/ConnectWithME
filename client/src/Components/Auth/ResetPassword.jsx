import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ChatState } from '../../Context/ChatConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, resetPasswordStep2Schema } from '../../utils/validationSchemas';
import { Mail, KeyRound, Lock, ShieldCheck, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    const navigate = useNavigate();
    const { setUser } = ChatState();

    const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm({
        resolver: zodResolver(resetPasswordSchema),
    });

    const { register: registerStep2, handleSubmit: handleSubmitStep2, setValue, formState: { errors: errorsStep2 } } = useForm({
        resolver: zodResolver(resetPasswordStep2Schema),
    });

    useEffect(() => {
        registerStep2('otp');
    }, [registerStep2]);

    const handleOtpChange = (index, value) => {
        const digit = value.slice(-1);
        if (digit && !/^\d+$/.test(digit)) return;

        const newDigits = [...otpDigits];
        newDigits[index] = digit;
        setOtpDigits(newDigits);

        const combined = newDigits.join('');
        setValue('otp', combined, { shouldValidate: true });

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtpDigits(digits);
            setValue('otp', pastedData, { shouldValidate: true });
            inputRefs.current[5]?.focus();
        }
    };

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

    const labelClasses = "block text-xs font-bold text-neon-blue/90 uppercase tracking-wider mb-1";

    return (
        <div className='min-h-screen flex items-center justify-center p-4 relative overflow-x-hidden'>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/20 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000"></div>

            <div className='glass w-full max-w-xl rounded-2xl overflow-hidden relative z-10 shadow-2xl border border-white/10'>
                <div className='p-6 md:p-8 text-center border-b border-white/10 bg-white/5'>
                    <h1 className='text-5xl font-display font-bold text-gradient tracking-wider mb-2 drop-shadow-lg'>
                        ConnecT
                    </h1>
                    <p className='text-gray-300 font-light tracking-widest text-xs md:text-sm uppercase flex items-center justify-center gap-2'>
                        <KeyRound className="w-4 h-4 text-neon-blue" />
                        {step === 1 ? 'Recover Your Account' : 'Security Verification'}
                    </p>
                </div>

                <div className='p-6 md:p-8'>
                    {step === 1 ? (
                        <form onSubmit={handleSubmitStep1(onStep1Submit)} className="space-y-6 animate-fade-in">
                            <div className="text-center mb-2">
                                <h3 className="text-lg font-semibold text-white">Forgot Password?</h3>
                                <p className="text-gray-400 text-xs md:text-sm mt-1">
                                    Enter your registered email address below to receive a 6-digit verification code.
                                </p>
                            </div>

                            <div className='space-y-1'>
                                <label className={labelClasses}>Email Address</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                    <input
                                        type='email'
                                        placeholder='john@example.com'
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-dark-surface/60 border ${errorsStep1.email ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/30 transition-all outline-none text-sm`}
                                        {...registerStep1("email")}
                                    />
                                </div>
                                {errorsStep1.email && <p className="text-red-400 text-xs mt-1">{errorsStep1.email.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-base tracking-wider shadow-[0_0_20px_rgba(0,243,255,0.35)] hover:shadow-[0_0_30px_rgba(0,243,255,0.65)] transition-all duration-300 flex items-center justify-center gap-2 ${loading
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white hover:scale-[1.01]'
                                    }`}
                            >
                                {loading ? 'Sending OTP...' : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Send Verification Code</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="w-full text-gray-400 hover:text-white text-xs md:text-sm mt-2 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Back to Login</span>
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitStep2(onStep2Submit)} className="space-y-6 animate-fade-in-up">
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-semibold text-white">Enter OTP Verification Code</h3>
                                <p className="text-gray-400 text-xs md:text-sm mt-1">
                                    We sent a 6-digit code to <span className="text-neon-blue font-mono font-semibold">{email}</span>
                                </p>
                            </div>

                            {/* 6 Separate Numeric Input Boxes */}
                            <div className='space-y-2'>
                                <label className="block text-xs font-bold text-neon-blue uppercase tracking-wider text-center mb-2">
                                    6-Digit OTP Code
                                </label>
                                <div className="flex justify-center items-center gap-2 md:gap-3">
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={1}
                                            autoComplete="off"
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            onPaste={handleOtpPaste}
                                            className={`w-11 h-13 md:w-13 md:h-14 text-center text-2xl font-bold font-mono rounded-xl bg-dark-surface/80 border ${errorsStep2.otp ? 'border-red-500' : 'border-white/20'} text-white focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all outline-none shadow-inner`}
                                        />
                                    ))}
                                </div>
                                {errorsStep2.otp && <p className="text-red-400 text-xs text-center mt-2">{errorsStep2.otp.message}</p>}
                            </div>

                            {/* New Passwords Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className='space-y-1'>
                                    <label className={labelClasses}>New Password</label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                        <input
                                            type='password'
                                            placeholder='••••••••'
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errorsStep2.password ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/30 transition-all outline-none text-sm`}
                                            {...registerStep2("password")}
                                        />
                                    </div>
                                    {errorsStep2.password && <p className="text-red-400 text-xs mt-1">{errorsStep2.password.message}</p>}
                                </div>

                                <div className='space-y-1'>
                                    <label className={labelClasses}>Confirm Password</label>
                                    <div className="relative">
                                        <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                        <input
                                            type='password'
                                            placeholder='••••••••'
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errorsStep2.confirmPassword ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/30 transition-all outline-none text-sm`}
                                            {...registerStep2("confirmPassword")}
                                        />
                                    </div>
                                    {errorsStep2.confirmPassword && <p className="text-red-400 text-xs mt-1">{errorsStep2.confirmPassword.message}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-base tracking-wider shadow-[0_0_20px_rgba(72,187,120,0.4)] hover:shadow-[0_0_30px_rgba(72,187,120,0.7)] transition-all duration-300 flex items-center justify-center gap-2 ${loading
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-[1.01]'
                                    }`}
                            >
                                {loading ? 'Resetting Password...' : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Reset Password & Login</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep(1);
                                    setOtpDigits(['', '', '', '', '', '']);
                                }}
                                className="w-full text-gray-400 hover:text-white text-xs md:text-sm mt-2 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Change Email Address</span>
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
