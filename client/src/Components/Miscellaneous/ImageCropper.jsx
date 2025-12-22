import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import { X, Check } from 'lucide-react';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = async () => {
        setLoading(true);
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            // Create a file from blob to simulate file upload
            const file = new File([croppedImage], "profile_cropped.jpg", { type: "image/jpeg" });
            onCropComplete(file);
        } catch (e) {
            console.error(e);
            alert("Failed to crop image");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-lg bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[500px]">
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button
                        onClick={onCancel}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={showCroppedImage}
                        disabled={loading}
                        className="p-2 bg-neon-blue hover:bg-blue-600 rounded-full text-white transition-colors shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                    >
                        {loading ? <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' /> : <Check size={20} />}
                    </button>
                </div>

                <div className="relative flex-1 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        cropShape="round"
                        showGrid={false}
                    />
                </div>

                <div className="p-4 bg-[#1a1a1a] border-t border-white/10">
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400 font-medium">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => {
                                setZoom(e.target.value);
                            }}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
