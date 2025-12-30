import React from 'react';

const Loading = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black/90 z-50">
            {/* Main pulsing orb */}
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-t-neon-blue border-r-neon-purple border-b-neon-pink border-l-transparent animate-spin"></div>

                {/* Inner glow */}
                <div className="absolute top-0 left-0 w-16 h-16 rounded-full bg-gradient-to-tr from-neon-blue/20 to-neon-purple/20 blur-xl animate-pulse"></div>
            </div>

            {/* Text with gradient */}
            <h2 className="mt-8 text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink animate-pulse">
                CONNECTING...
            </h2>
        </div>
    );
};

export default Loading;
