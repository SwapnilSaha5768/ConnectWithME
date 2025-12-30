import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ImageCropper from '../Miscellaneous/ImageCropper';
import { ChatState } from '../../Context/ChatConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema } from '../../utils/validationSchemas';

const Signup = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(signupSchema),
    });
    const [pic, setPic] = useState();
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const [showCropper, setShowCropper] = useState(false);
    const [tempImgSrc, setTempImgSrc] = useState(null);

    const navigate = useNavigate();
    const { setUser } = ChatState();

    const onFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'image/jpeg' && file.type !== 'image/png' && file.type !== 'image/jpg') {
            return alert("Please select a valid image (JPEG/PNG)");
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
            alert("Image upload configuration missing. Please check VITE_IMGBB_API_KEY.");
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
                toast.success('Image Uploaded Successfully');
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
            toast.warning('Please select an image');
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
    }

    const inputClasses = "w-full px-4 py-3 rounded-lg bg-dark-surface/50 border border-white/10 text-white placeholder-gray-500 focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all outline-none";
    const errorClasses = "border-red-500";
    const labelClasses = "block text-xs font-bold text-neon-pink uppercase tracking-wider";

    return (
        <div className='space-y-5 animate-fade-in'>
            {showCropper && (
                <ImageCropper
                    imageSrc={tempImgSrc}
                    onCancel={() => setShowCropper(false)}
                    onCropComplete={performUpload}
                />
            )}

            {!otpSent ? (
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                    <div className='space-y-1'>
                        <label className={labelClasses}>Name</label>
                        <input
                            type='text' placeholder='Enter your name'
                            className={`${inputClasses} ${errors.name ? errorClasses : ''}`}
                            {...register("name")}
                        />
                        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>
                    <div className='space-y-1'>
                        <label className={labelClasses}>Email</label>
                        <input
                            type='email' placeholder='Enter your email'
                            className={`${inputClasses} ${errors.email ? errorClasses : ''}`}
                            {...register("email")}
                        />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                    </div>
                    <div className='space-y-1'>
                        <label className={labelClasses}>Password</label>
                        <input
                            type='password' placeholder='Enter Password'
                            className={`${inputClasses} ${errors.password ? errorClasses : ''}`}
                            {...register("password")}
                        />
                        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                    </div>
                    <div className='space-y-1'>
                        <label className={labelClasses}>Confirm Password</label>
                        <input
                            type='password' placeholder='Confirm Password'
                            className={`${inputClasses} ${errors.confirmpassword ? errorClasses : ''}`}
                            {...register("confirmpassword")}
                        />
                        {errors.confirmpassword && <p className="text-red-500 text-xs">{errors.confirmpassword.message}</p>}
                    </div>
                    <div className='space-y-1'>
                        <label className={labelClasses}>Profile Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onFileSelect}
                            className={`${inputClasses} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-pink/10 file:text-neon-pink hover:file:bg-neon-pink/20 cursor-pointer`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-lg tracking-wide shadow-[0_0_15px_rgba(255,0,153,0.3)] hover:shadow-[0_0_25px_rgba(255,0,153,0.5)] transition-all duration-300 ${loading
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white'
                            }`}
                    >
                        {loading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>
            ) : (
                <div className="space-y-4 animate-fade-in-up">
                    <div className="text-center">
                        <h3 className="text-lg font-display text-white">Enter Verification Code</h3>
                        <p className="text-gray-400 text-sm">We sent a 6-digit code to {submittedEmail}</p>
                    </div>
                    <div className='space-y-2'>
                        <input
                            type='text' placeholder='Enter 6-digit OTP'
                            className={`${inputClasses} text-center text-2xl tracking-[0.5em] font-display`}
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
