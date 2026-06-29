import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImageCropper from '../Miscellaneous/ImageCropper';
import { ChatState } from '../../Context/ChatConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from '../../utils/validationSchemas';
import GoogleAuthButton from './GoogleAuthButton';
import { User, Mail, Lock, ShieldCheck, Camera, Sparkles } from 'lucide-react';

const Signup = () => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(signupSchema),
    });
    const [pic, setPic] = useState();
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const [showCropper, setShowCropper] = useState(false);
    const [tempImgSrc, setTempImgSrc] = useState(null);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const { setUser } = ChatState();

    const onFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/jpg') {
            return toast.error("Please select a valid image (JPEG/PNG)");
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setTempImgSrc(reader.result);
            setShowCropper(true);
        };
    };

    const performUpload = (croppedFile) => {
        setLoading(true);
        setShowCropper(false);

        const data = new FormData();
        data.append("image", croppedFile);

        const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

        if (!apiKey) {
            toast.error("Image upload configuration missing.");
            setLoading(false);
            return;
        }

        fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "post",
            body: data,
        })
            .then((res) => res.json())
            .then((data) => {
                setPic(data.data.url.toString());
                setLoading(false);
                toast.success('Profile picture updated!');
            })
            .catch((err) => {
                console.log(err);
                toast.error("Failed to upload image.");
                setLoading(false);
            });
    };

    const onSubmit = async (data) => {
        setLoading(true);

        if (!pic) {
            toast.warning('Please upload a profile picture to complete signup');
            setLoading(false);
            return;
        }

        const { name, email, password } = data;

        try {
            const config = { headers: { 'Content-type': 'application/json' } };
            await axios.post('/api/user/register', { name, email, password, pic }, config);
            toast.success('Registration successful! Please check your email for verification.');

            setSubmittedEmail(email);
            setOtpSent(true);
            setLoading(false);
        } catch (error) {
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
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            setLoading(false);
            toast.success('Registration Successful');
            navigate('/chats');
        } catch (error) {
            toast.error('Verification Failed: ' + (error.response && error.response.data.message ? error.response.data.message : error.message));
            setLoading(false);
        }
    };

    const labelClasses = "block text-xs font-bold text-neon-pink/90 uppercase tracking-wider mb-1";

    return (
        <div className='space-y-6 animate-fade-in'>
            {showCropper && (
                <ImageCropper
                    imageSrc={tempImgSrc}
                    onCancel={() => setShowCropper(false)}
                    onCropComplete={performUpload}
                />
            )}

            {!otpSent ? (
                <div className="space-y-5">
                    <GoogleAuthButton isSignup={true} />

                    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                        {/* Interactive Avatar Upload Section */}
                        <div className="flex flex-col items-center justify-center pb-2">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-full border-2 border-neon-pink/60 hover:border-neon-pink shadow-[0_0_20px_rgba(255,0,153,0.35)] hover:shadow-[0_0_30px_rgba(255,0,153,0.6)] transition-all duration-300 cursor-pointer relative group overflow-hidden bg-white/5 flex items-center justify-center"
                            >
                                {pic ? (
                                    <img src={pic} alt="Profile preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400 group-hover:text-neon-pink transition-colors">
                                        <Camera className="w-8 h-8 mb-1 animate-bounce-short" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Photo</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-xs font-semibold">
                                    <Camera className="w-6 h-6 mb-0.5" />
                                    <span>{pic ? 'Change' : 'Upload'}</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={onFileSelect}
                                className="hidden"
                            />
                            <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-neon-pink" />
                                {pic ? "Photo uploaded" : "Upload avatar picture"}
                            </p>
                        </div>

                        {/* 2-Column Responsive Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name Input */}
                            <div className='space-y-1'>
                                <label className={labelClasses}>Full Name</label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                    <input
                                        type='text'
                                        placeholder='John Doe'
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errors.name ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/30 transition-all outline-none text-sm`}
                                        {...register("name")}
                                    />
                                </div>
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            {/* Email Input */}
                            <div className='space-y-1'>
                                <label className={labelClasses}>Email Address</label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                    <input
                                        type='email'
                                        placeholder='john@example.com'
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errors.email ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/30 transition-all outline-none text-sm`}
                                        {...register("email")}
                                    />
                                </div>
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            {/* Password Input */}
                            <div className='space-y-1'>
                                <label className={labelClasses}>Password</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                    <input
                                        type='password'
                                        placeholder='••••••••'
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errors.password ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/30 transition-all outline-none text-sm`}
                                        {...register("password")}
                                    />
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                            </div>

                            {/* Confirm Password Input */}
                            <div className='space-y-1'>
                                <label className={labelClasses}>Confirm Password</label>
                                <div className="relative">
                                    <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                                    <input
                                        type='password'
                                        placeholder='••••••••'
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-surface/60 border ${errors.confirmpassword ? 'border-red-500' : 'border-white/10'} text-white placeholder-gray-500 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/30 transition-all outline-none text-sm`}
                                        {...register("confirmpassword")}
                                    />
                                </div>
                                {errors.confirmpassword && <p className="text-red-400 text-xs mt-1">{errors.confirmpassword.message}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-4 py-3 px-4 rounded-xl font-bold text-base tracking-wider shadow-[0_0_20px_rgba(255,0,153,0.4)] hover:shadow-[0_0_30px_rgba(255,0,153,0.7)] transition-all duration-300 flex items-center justify-center gap-2 ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white hover:scale-[1.01]'
                                }`}
                        >
                            {loading ? 'Processing Registration...' : 'Create Account'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="text-center">
                        <h3 className="text-lg font-display text-white">Enter Verification Code</h3>
                        <p className="text-gray-400 text-sm">We sent a 6-digit code to {submittedEmail}</p>
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
                        onClick={() => setOtpSent(false)}
                        className="w-full text-gray-400 hover:text-white text-sm mt-2"
                    >
                        Back to Signup
                    </button>
                </div>
            )}
        </div>
    );
};

export default Signup;
