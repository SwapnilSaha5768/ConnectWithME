import React, { useState } from 'react';
import axios from 'axios';
import { ChatState } from '../../Context/ChatConfig';
import { toast } from 'react-toastify';

const GroupChatModal = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [groupChatName, setGroupChatName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);

    const { user, chats, setChats } = ChatState();

    const handleSearch = async (query) => {
        setSearch(query);
        if (!query) return;

        try {
            setLoading(true);
            const config = {
                headers: {}
            };

            const { data } = await axios.get(`/api/user?search=${query}`, config);
            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            toast.error("Failed to Load the Search Results");
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!groupChatName || selectedUsers.length < 2) {
            toast.warning("Please provide a chat name and select at least 2 users.");
            return;
        }

        try {
            const config = {
                headers: {}
            };

            const { data } = await axios.post('/api/chat/group', {
                name: groupChatName,
                users: JSON.stringify(selectedUsers.map((u) => u._id)),
            }, config);

            setChats([data, ...chats]);
            setIsOpen(false);
            toast.success("New Group Chat Created!");
        } catch (error) {
            toast.error("Failed to Create the Chat!");
        }
    };

    const handleGroup = (userToAdd) => {
        if (selectedUsers.includes(userToAdd)) {
            toast.warning("User already added");
            return;
        }
        setSelectedUsers([...selectedUsers, userToAdd]);
    };

    const handleDelete = (delUser) => {
        setSelectedUsers(selectedUsers.filter(sel => sel._id !== delUser._id));
    };


    return (
        <>
            <span onClick={() => setIsOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity">{children}</span>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-white">
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                        aria-hidden="true"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    <div className="relative inline-block align-bottom bg-[#1a1a1a] border border-white/10 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full z-10">
                        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3
                                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-white to-neon-purple tracking-wider mb-6 text-center"
                                style={{ fontFamily: '"Roboto", sans-serif' }}
                            >
                                Create Group Chat
                            </h3>

                            <div className="space-y-4">
                                <input
                                    placeholder='Chat Name'
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                    onChange={(e) => setGroupChatName(e.target.value)}
                                />
                                <input
                                    placeholder='Search Users'
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all"
                                    onChange={(e) => handleSearch(e.target.value)}
                                />

                                {/* Selected Users Chips */}
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.map((u) => (
                                        <div key={u._id} className="bg-neon-purple/20 border border-neon-purple/30 text-neon-purple px-3 py-1 rounded-full text-sm flex items-center">
                                            {u.name}
                                            <span onClick={() => handleDelete(u)} className="ml-2 cursor-pointer hover:text-white transition-colors">x</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Render Search Results */}
                                {loading ? (
                                    <div className="text-center text-neon-blue animate-pulse py-2">Loading...</div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                        {searchResult?.slice(0, 4).map(user => (
                                            <div
                                                key={user._id}
                                                onClick={() => handleGroup(user)}
                                                className="cursor-pointer hover:bg-white/10 p-2 rounded-lg flex items-center space-x-3 transition-all mb-1 group"
                                            >
                                                <img src={user.pic} alt={user.name} className="h-10 w-10 rounded-full border border-white/10 group-hover:border-neon-blue/50" />
                                                <div>
                                                    <p className='font-semibold text-gray-200 group-hover:text-white'>{user.name}</p>
                                                    <p className='text-xs text-gray-500 group-hover:text-gray-400'>{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/5 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
                            <button
                                onClick={handleSubmit}
                                type="button"
                                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-neon-blue text-base font-bold text-black hover:bg-cyan-400 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-all"
                            >
                                Create Chat
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-lg border border-white/10 shadow-sm px-4 py-2 bg-white/5 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GroupChatModal;
