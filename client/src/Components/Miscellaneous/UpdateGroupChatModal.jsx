import React, { useState } from 'react';
import axios from 'axios';
import { ChatState } from '../../Context/ChatConfig';
import { toast } from 'react-toastify';

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages }) => {
    const { selectedChat, setSelectedChat, user } = ChatState();

    const [isOpen, setIsOpen] = useState(false);
    const [groupChatName, setGroupChatName] = useState('');
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [renameloading, setRenameloading] = useState(false);

    const handleRemove = async (user1) => {
        if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
            toast.error("Only admins can remove users!");
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const { data } = await axios.put(
                `/api/chat/groupremove`,
                {
                    chatId: selectedChat._id,
                    userId: user1._id,
                },
                config
            );

            user1._id === user._id ? setSelectedChat() : setSelectedChat(data);
            setFetchAgain(!fetchAgain);
            fetchMessages(); // Refresh messages in parent
            setLoading(false);
        } catch (error) {
            toast.error("Error removing user");
            setLoading(false);
        }
    };

    const handleRename = async () => {
        if (!groupChatName) return;

        try {
            setRenameloading(true);
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const { data } = await axios.put(
                `/api/chat/rename`,
                {
                    chatId: selectedChat._id,
                    chatName: groupChatName,
                },
                config
            );

            setSelectedChat(data);
            setFetchAgain(!fetchAgain);
            setRenameloading(false);
            setGroupChatName("");
        } catch (error) {
            toast.error("Error renaming group");
            setRenameloading(false);
            setGroupChatName("");
        }
    };

    const handleSearch = async (query) => {
        setSearch(query);
        if (!query) return;

        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const { data } = await axios.get(`/api/user?search=${query}`, config);
            setLoading(false);
            setSearchResult(data);
        } catch (error) {
            toast.error("Error searching user");
            setLoading(false);
        }
    };

    const handleAddUser = async (user1) => {
        if (selectedChat.users.find((u) => u._id === user1._id)) {
            toast.error("User Already in group!");
            return;
        }

        if (selectedChat.groupAdmin._id !== user._id) {
            toast.error("Only admins can add someone!");
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const { data } = await axios.put(
                '/api/chat/groupadd',
                {
                    chatId: selectedChat._id,
                    userId: user1._id,
                },
                config
            );

            setSelectedChat(data);
            setFetchAgain(!fetchAgain);
            setLoading(false);
        } catch (error) {
            toast.error("Error Adding User");
            setLoading(false);
        }
    }

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white">
                <i className="fas fa-eye"></i>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-white min-w-full">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setIsOpen(false)}></div>

                    <div className="relative inline-block align-bottom bg-[#1a1a1a] border border-white/10 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full z-10">
                        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-white to-neon-purple tracking-wider mb-6 text-center" style={{ fontFamily: '"Roboto", sans-serif' }}>{selectedChat.chatName}</h3>

                            <div className="flex flex-wrap gap-2 justify-center mb-6">
                                {selectedChat.users.map((u) => (
                                    <div key={u._id} className="bg-neon-purple/20 border border-neon-purple/30 text-neon-purple px-3 py-1 rounded-full text-sm flex items-center">
                                        {u.name}
                                        <span onClick={() => handleRemove(u)} className="ml-2 cursor-pointer hover:text-white transition-colors text-red-400 font-bold">x</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="flex space-x-2">
                                    <input
                                        placeholder="Rename Chat"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                                        value={groupChatName}
                                        onChange={(e) => setGroupChatName(e.target.value)}
                                    />
                                    <button
                                        className={`bg-neon-blue/20 border border-neon-blue/50 text-neon-blue px-4 py-2 rounded-lg hover:bg-neon-blue hover:text-black transition-all font-bold ${renameloading ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={handleRename}
                                        disabled={renameloading}
                                    >
                                        Update
                                    </button>
                                </div>

                                <div>
                                    <input
                                        placeholder="Search Users"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all"
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />

                                    {loading ? (
                                        <div className="text-center text-neon-blue animate-pulse py-2">Loading...</div>
                                    ) : (
                                        <div className="max-h-48 overflow-y-auto custom-scrollbar mt-2">
                                            {searchResult?.slice(0, 4).map(user => (
                                                <div key={user._id} onClick={() => handleAddUser(user)} className="cursor-pointer hover:bg-white/10 p-2 rounded-lg flex items-center space-x-3 transition-all mb-1 group">
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
                        </div>
                        <div className="bg-white/5 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
                            <button onClick={() => handleRemove(user)} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600/80 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-all backdrop-blur-sm">
                                Leave Group
                            </button>
                            <button onClick={() => setIsOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-white/10 shadow-sm px-4 py-2 bg-white/5 text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UpdateGroupChatModal;
