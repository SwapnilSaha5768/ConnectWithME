import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { ChatState } from '../Context/ChatProvider';
import SideDrawer from '../Components/Chat/SideDrawer';
import MyChats from '../Components/Chat/MyChats';
import ChatBox from '../Components/Chat/ChatBox';
import CallModal from '../Components/Chat/CallModal';

const ENDPOINT = import.meta.env.VITE_SERVER_URL || 'http://10.11.205.79:5000';
var selectedChatCompare;

const ChatPage = () => {
    const { user, selectedChat, setSelectedChat, notification, setNotification, setChats, chats, socket } = ChatState();
    const [fetchAgain, setFetchAgain] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    // Call State
    const [stream, setStream] = useState(null);
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [isIncoming, setIsIncoming] = useState(false);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        if (socket?.connected) setSocketConnected(true);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on('connected', () => setSocketConnected(true));
        socket.on('message recieved', (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
                if (!notification.includes(newMessageRecieved)) {
                    setNotification([newMessageRecieved, ...notification]);
                    setFetchAgain(!fetchAgain);
                }
            }
        });

        // Call Events
        socket.on('callUser', (data) => {
            console.log("Incoming Call:", data);
            setCall({ isReceivingCall: true, from: data.from, name: data.name, signal: data.signal, pic: data.pic });
            setIsIncoming(true);
        });

        // We listen for 'callAccepted' inside the makeCall function context usually, 
        // but since we separate logic, we might need a global listener or handle it within the peer instance creation.
        // Actually, simple-peer 'signal' event handles the handshake. 
        // But we need to signal the INITIATOR that the call is accepted.

        return () => {
            socket.off("connected");
            socket.off("message recieved");
            socket.off("callUser");
        };
    }, [socket, user, notification, fetchAgain, selectedChat]);

    useEffect(() => {
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    const getMedia = async () => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            setStream(currentStream);
            if (myVideo.current) myVideo.current.srcObject = currentStream;
            return currentStream;
        } catch (err) {
            console.error("Failed to get media", err);
            alert("Could not access microphone.");
            return null;
        }
    };

    const answerCall = async () => {
        setCallAccepted(true);
        const currentStream = await getMedia();
        if (!currentStream) return;

        const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

        peer.on('signal', (data) => {
            socket.emit('answerCall', { signal: data, to: call.from });
        });

        peer.on('stream', (currentStream) => {
            if (userVideo.current) userVideo.current.srcObject = currentStream;
        });

        peer.signal(call.signal);
        connectionRef.current = peer;
    };

    const startCall = async (idToCall, userName, userPic) => {
        const currentStream = await getMedia();
        if (!currentStream) return;

        setCall({ isReceivingCall: false, name: userName, pic: userPic, from: user._id }); // Setting local UI state
        setIsIncoming(false);
        setCallEnded(false);
        setCallAccepted(false);

        const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

        peer.on('signal', (data) => {
            socket.emit('callUser', {
                userToCall: idToCall,
                signalData: data,
                from: user._id,
                name: user.name,
                pic: user.pic
            });
        });

        peer.on('stream', (currentStream) => {
            if (userVideo.current) userVideo.current.srcObject = currentStream;
        });

        socket.on('callAccepted', (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
        });

        socket.on('endCall', () => {
            leaveCall();
        });

        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        setIsIncoming(false);
        if (connectionRef.current) connectionRef.current.destroy();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCall({});
        // window.location.reload(); // Quick fix for stream cleanup issues, but let's try to avoid full reload
    };

    return (
        <div className='w-full h-[100dvh] flex flex-col relative'>
            {/* Background blobs for depth */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-purple/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[150px]"></div>
            </div>

            {(isIncoming || (call.name && !callEnded)) && (
                <CallModal
                    stream={stream}
                    callAccepted={callAccepted}
                    myVideo={myVideo}
                    userVideo={userVideo}
                    callEnded={callEnded}
                    answerCall={answerCall}
                    call={call}
                    name={name}
                    leaveCall={leaveCall}
                    isIncoming={isIncoming}
                />
            )}

            {user && <SideDrawer />}
            <div className='flex justify-between w-full h-[91dvh] p-4 gap-4'>
                {user && (
                    <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[31%] h-full`}>
                        <MyChats fetchAgain={fetchAgain} />
                    </div>
                )}
                {user && (
                    <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[68%] h-full`}>
                        <ChatBox
                            fetchAgain={fetchAgain}
                            setFetchAgain={setFetchAgain}
                            socket={socket}
                            socketConnected={socketConnected}
                            startCall={startCall}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
