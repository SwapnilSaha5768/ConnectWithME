import React, { useRef, useEffect, Fragment } from 'react';
import { ChatState } from '../../Context/ChatConfig';
import { MoreVertical, Trash2, XCircle, MapPin } from 'lucide-react';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import axios from 'axios';

const ScrollableChat = ({ messages, setMessages }) => {
    const { user, socket } = ChatState();

    const deleteMessage = async (messageId, type) => {
        try {
            const config = { data: { type } };
            const { data } = await axios.delete(`/api/message/${messageId}`, config);

            // Remove from local view
            setMessages(messages.filter((m) => m._id !== messageId));

            // If unsent for everyone, notify others
            if (type === 'everyone') {
                socket.emit('delete message', {
                    id: messageId,
                    chat: data.chat,
                    sender: user._id
                });
            }
        } catch (error) {
            alert("Failed to delete message");
        }
    };

    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const isSameSender = (messages, m, i, userId) => {
        return (
            i < messages.length - 1 &&
            (messages[i + 1].sender._id !== m.sender._id ||
                messages[i + 1].sender._id === undefined) &&
            messages[i].sender._id !== userId
        );
    };

    const isLastMessage = (messages, i, userId) => {
        return (
            i === messages.length - 1 &&
            messages[messages.length - 1].sender._id !== userId &&
            messages[messages.length - 1].sender._id
        );
    };

    const isSameSenderMargin = (messages, m, i, userId) => {
        if (
            i < messages.length - 1 &&
            messages[i + 1].sender._id === m.sender._id &&
            messages[i].sender._id !== userId
        )
            return 36;
        else if (
            (i < messages.length - 1 &&
                messages[i + 1].sender._id !== m.sender._id &&
                messages[i].sender._id !== userId) ||
            (i === messages.length - 1 && messages[i].sender._id !== userId)
        )
            return 0;
        else return "auto";
    };

    const isSameUser = (messages, m, i) => {
        return i < messages.length - 1 && (
            messages[i + 1].sender._id === m.sender._id ||
            messages[i + 1].sender._id === undefined
        );
    };

    return (
        <div className='flex flex-col'>
            {messages && messages.map((m, i) => {
                // Find users who have read this message and it's the LAST message they read
                // But simplified: For every message, show avatars of users who have read THIS message
                // and THIS is the latest message they have read in the loaded history.
                // However, common design is just show their avatar at the bottom of the last message they read.

                // Better approach for "Seen":
                // For each other user in the chat:
                // Find the index of the last message they are in 'readBy'.
                // If the current message index === that index, show their avatar.

                // Let's filter readBy to exclude current user and sender
                const seenUsers = m.readBy ? m.readBy.filter(uId =>
                    uId !== user._id &&
                    uId !== m.sender._id &&
                    // Ensure this is the LAST message this user has read locally
                    messages.map(msg => msg.readBy.includes(uId) ? msg._id : null).filter(Boolean).pop() === m._id
                ) : [];

                return (
                    <div
                        className={`flex flex-col ${(i === messages.length - 1 || messages[i + 1].sender._id !== m.sender._id) ? 'mb-4' : 'mb-1'}`}
                        key={m._id}
                    >
                        <div className='flex'>
                            {(isSameSender(messages, m, i, user._id) || isLastMessage(messages, i, user._id)) && (
                                <div className="tooltip" title={m.sender.name}>
                                    <img
                                        className='h-8 w-8 rounded-full cursor-pointer mr-1 mt-3 border border-white/20'
                                        alt={m.sender.name}
                                        src={m.sender.pic}
                                    />
                                </div>
                            )}
                            <div
                                className={`relative group flex items-center gap-2 max-w-[75%] ${m.sender._id === user._id ? "flex-row-reverse" : "flex-row"}`}
                                style={{
                                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                                }}
                            >
                                {/* Message Bubble */}
                                <span
                                    className={`${m.type === 'image'
                                        ? "rounded-lg overflow-hidden my-1 relative z-10"
                                        : `rounded-2xl px-4 py-2 my-1 text-sm md:text-base shadow-md backdrop-blur-sm relative z-10 break-words whitespace-pre-wrap ${m.sender._id === user._id
                                            ? "bg-gradient-to-r from-neon-blue to-indigo-600 text-white rounded-br-none"
                                            : "bg-white/10 text-white border border-white/10 rounded-bl-none"
                                        }`
                                        }`}
                                >
                                    {m.type === 'location' ? (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${m.content}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 hover:underline text-white font-medium transition-all"
                                        >
                                            <MapPin size={18} className="text-white" />
                                            Shared Location
                                        </a>
                                    ) : m.type === 'audio' ? (
                                        <audio controls src={m.content} className="max-w-[200px] h-8" />
                                    ) : m.type === 'image' ? (
                                        <img
                                            src={m.content}
                                            className="max-w-[250px] max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(m.content, "_blank", "noopener,noreferrer")}
                                        />
                                    ) : (
                                        m.content
                                    )}
                                </span>

                                {/* Menu Options */}
                                <Menu as="div" className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <MenuButton className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                                        <MoreVertical size={16} />
                                    </MenuButton>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <MenuItems className="absolute bottom-full mb-2 right-0 z-50 w-36 origin-bottom-right rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl focus:outline-none p-1 ring-1 ring-black/5">
                                            <div className="px-1 py-1 ">
                                                <MenuItem>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => deleteMessage(m._id, 'me')}
                                                            className={`${active ? 'bg-white/10 text-white' : 'text-gray-300'
                                                                } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-all duration-200`}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                                                            Delete
                                                        </button>
                                                    )}
                                                </MenuItem>
                                                {m.sender._id === user._id && (
                                                    <MenuItem>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={() => deleteMessage(m._id, 'everyone')}
                                                                className={`${active ? 'bg-red-500/10 text-red-400' : 'text-gray-300'
                                                                    } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-all duration-200 mt-1`}
                                                            >
                                                                <XCircle className="mr-2 h-4 w-4 text-red-400" />
                                                                Unsend
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                )}
                                            </div>
                                        </MenuItems>
                                    </Transition>
                                </Menu>
                            </div>
                        </div>
                        {/* Seen Indicator */}
                        {seenUsers.length > 0 && m.sender._id === user._id && (
                            <div className="flex justify-end items-center gap-1 mt-1 mr-2">
                                {seenUsers.map(userId => {
                                    // Find user object from chat users? 
                                    // Actually we don't have full user objects in readBy array usually unless populated. 
                                    // But the message usually doesn't populate readBy with full objects by default in typical controller unless we requested it.
                                    // Let's check controller. 
                                    // messageController 'allMessages' does NOT populate readBy.
                                    // We might need to rely on the fact that if it's a 1-on-1 chat, the other user is known.
                                    // Or we modify controller to populate readBy.
                                    // For now, let's assume we just show a small "Seen" text or check if we can get user info.
                                    // Wait, the plan didn't say populate readBy.
                                    // Let's simplify: In 1-on-1, just show "Seen". In group, ideally show names/pics.
                                    // Given context, let's try to populate readBy in controller or just show a checkmark/eye icon.
                                    // OR: We can use the chat.users to match IDs to Pics.
                                    const userObj = socket && ChatState().selectedChat.users.find(u => u._id === userId);
                                    return userObj ? (
                                        <img key={userId} src={userObj.pic} alt={userObj.name} title={`Seen by ${userObj.name}`} className="w-4 h-4 rounded-full border border-white/20" />
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
            <div ref={bottomRef} />
        </div>
    );
};

export default ScrollableChat;
