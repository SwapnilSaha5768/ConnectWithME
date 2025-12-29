import React, { useEffect, useState } from 'react';
import { ChatState } from '../../Context/ChatConfig';
import axios from 'axios';
import { toast } from 'react-toastify';
import GroupChatModal from '../Miscellaneous/GroupChatModal';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { MoreVertical, Trash2, EyeOff, CheckCircle, Ban } from 'lucide-react';

const MyChats = ({ fetchAgain }) => {
    const [loggedUser, setLoggedUser] = useState();
    const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();

    const fetchChats = async () => {
        try {
            const config = {
                withCredentials: true,
            };
            const { data } = await axios.get('/api/chat', config);
            setChats(data);
        } catch (error) {
            toast.error("Error Occured! Failed to Load the chats");
        }
    };

    useEffect(() => {
        setLoggedUser(user);
        if (!chats.length) fetchChats();
    }, [fetchAgain, user]);

    const getSender = (loggedUser, users) => {
        if (!loggedUser || !users || users.length < 2) return "User";
        return users[0]._id === loggedUser._id ? users[1].name : users[0].name;
    }

    const deleteChat = async (chatId, type) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/chat/${chatId}?type=${type}`, config);

            setChats(chats.filter(c => c._id !== chatId));
            if (selectedChat && selectedChat._id === chatId) setSelectedChat("");
            toast.success("Chat deleted successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete chat");
        }
    };

    const markUnread = async (chatId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`/api/message/unread`, { chatId }, config);
            fetchChats();
            toast.success("Chat marked as unread!");
        } catch (error) {
            toast.error("Failed to mark as unread");
        }
    };
    const clearChat = async (chatId) => {
        if (window.confirm("Are you sure you want to clear the entire chat history? This cannot be undone.")) {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                await axios.delete(`/api/message/clear/${chatId}`, config);

                // Update chats state to remove latestMessage
                setChats(chats.map(c =>
                    c._id === chatId ? { ...c, latestMessage: null } : c
                ));
                fetchChats(); // Optional: re-fetch to be safe
                toast.success("Chat history cleared!");
            } catch (error) {
                toast.error("Failed to clear chat");
            }
        }
    };

    const blockUser = async (userId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put('/api/user/block', { userId }, config);

            // Update local user state
            const updatedBlockedUsers = [...(loggedUser.blockedUsers || []), userId];
            setLoggedUser({ ...loggedUser, blockedUsers: updatedBlockedUsers });
            // Ideally update global context too
            toast.success("User blocked successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to block user");
        }
    };

    const unblockUser = async (userId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put('/api/user/unblock', { userId }, config);

            // Update local user state
            const updatedBlockedUsers = loggedUser.blockedUsers.filter(id => id !== userId);
            setLoggedUser({ ...loggedUser, blockedUsers: updatedBlockedUsers });
            toast.success("User unblocked successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unblock user");
        }
    };

    return (
        <div className="glass flex flex-col p-4 w-full h-full rounded-xl">
            <div className='pb-4 px-2 text-2xl font-display font-bold text-white flex w-full justify-between items-center border-b border-white/10 mb-2'>
                My Chats
                <GroupChatModal>
                    <button className='text-sm flex bg-white/10 hover:bg-white/20 border border-white/5 text-gray-200 px-3 py-1.5 rounded-md items-center cursor-pointer transition-all'>
                        <i className="fas fa-plus mr-2"></i> New Group
                    </button>
                </GroupChatModal>
            </div>
            <div className="flex flex-col w-full h-full overflow-y-hidden">
                {chats && loggedUser ? (
                    <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {chats.map((chat) => {
                            // Check for unread messages
                            // Logic: If latestMessage is NOT read by current user, mark as unread
                            // Issues: latestMessage.readBy array might not be populated with ids, or might be empty. 
                            // Check if logedUser._id is in latestMessage.readBy
                            const isUnread = chat.latestMessage &&
                                !chat.latestMessage.readBy.includes(loggedUser._id) &&
                                chat.latestMessage.sender._id !== loggedUser._id;

                            return (
                                <div
                                    onClick={() => setSelectedChat(chat)}
                                    className={`cursor-pointer px-4 py-3 rounded-xl transition-all duration-300 border flex justify-between items-center ${selectedChat === chat
                                        ? 'bg-gradient-to-r from-neon-purple/80 to-neon-pink/80 text-white shadow-lg border-transparent'
                                        : `bg-white/5 hover:bg-white/10 text-gray-300 border-transparent hover:border-white/10 ${isUnread ? 'border-l-4 border-l-neon-pink bg-white/10' : ''}`
                                        }`}
                                    key={chat._id}
                                >
                                    <div className="flex flex-col">
                                        <p className={`font-medium tracking-wide ${isUnread ? 'font-bold text-white' : ''}`}>
                                            {!chat.isGroupChat ? getSender(loggedUser, chat.users) : chat.chatName}
                                        </p>
                                        {chat.latestMessage && (
                                            <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                                <span className="font-bold">{chat.latestMessage.sender.name}: </span>
                                                {chat.latestMessage.content.length > 50
                                                    ? chat.latestMessage.content.substring(0, 51) + "..."
                                                    : chat.latestMessage.content}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        {isUnread && (
                                            <div className="bg-neon-pink w-2.5 h-2.5 rounded-full shadow-[0_0_8px_theme(colors.neon.pink)] animate-pulse mr-3"></div>
                                        )}

                                        {/* Action Menu */}
                                        <Menu as="div" className="relative">
                                            <MenuButton
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                                            >
                                                <MoreVertical size={16} />
                                            </MenuButton>

                                            <MenuItems
                                                transition
                                                anchor="bottom end"
                                                className="z-50 w-48 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl focus:outline-none p-1 ring-1 ring-black/5 transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                                            >
                                                <div className="px-1 py-1">
                                                    {!chat.isGroupChat && (
                                                        <MenuItem>
                                                            {({ active }) => {
                                                                const otherUser = chat.users.find(u => u._id !== loggedUser._id);
                                                                const isBlocked = loggedUser.blockedUsers?.includes(otherUser?._id);

                                                                return (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (isBlocked) unblockUser(otherUser._id);
                                                                            else blockUser(otherUser._id);
                                                                        }}
                                                                        className={`${active ? 'bg-white/10 text-white' : 'text-gray-300'
                                                                            } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-all mb-1`}
                                                                    >
                                                                        <Ban className="mr-2 h-4 w-4 text-red-400" />
                                                                        {isBlocked ? "Unblock" : "Block"}
                                                                    </button>
                                                                );
                                                            }}
                                                        </MenuItem>
                                                    )}
                                                    <MenuItem>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markUnread(chat._id);
                                                                }}
                                                                className={`${active ? 'bg-white/10 text-white' : 'text-gray-300'
                                                                    } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-all`}
                                                            >
                                                                <EyeOff className="mr-2 h-4 w-4 text-neon-blue" />
                                                                Mark as Unread
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                    <div className="my-1 h-px bg-white/10" />
                                                    <MenuItem>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    clearChat(chat._id);
                                                                }}
                                                                className={`${active ? 'bg-white/10 text-white' : 'text-gray-300'
                                                                    } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-all`}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4 text-blue-400" />
                                                                Clear Chat
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                    <MenuItem>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteChat(chat._id, 'me');
                                                                }}
                                                                className={`${active ? 'bg-white/10 text-white' : 'text-gray-300'
                                                                    } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-all`}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4 text-orange-400" />
                                                                Delete for Me
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                    <MenuItem>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm("Are you sure? This will delete the chat for everyone permanently.")) {
                                                                        deleteChat(chat._id, 'everyone');
                                                                    }
                                                                }}
                                                                className={`${active ? 'bg-red-500/10 text-red-400' : 'text-gray-300'
                                                                    } group flex w-full items-center rounded-lg px-2 py-2 text-sm transition-all mt-1`}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                                Delete for Everyone
                                                            </button>
                                                        )}
                                                    </MenuItem>
                                                </div>
                                            </MenuItems>
                                        </Menu>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex justify-center p-4">
                        <span className="animate-spin h-8 w-8 border-2 border-neon-purple rounded-full border-t-transparent"></span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyChats;
