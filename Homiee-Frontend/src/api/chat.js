import api from './axios';

export const getConversations = async () => {
  const response = await api.get('/chat/inbox');
  return response.data;
};

export const getConversationMessages = async (otherUserId) => {
  const response = await api.get(`/chat/${otherUserId}`);
  return response.data;
};

export const sendMessage = async ({ receiverId, message }) => {
  const response = await api.post('/chat/send', {
    receiverId,
    message,
  });

  return response.data;
};

export const markConversationAsRead = async (senderId) => {
  const response = await api.put(`/chat/${senderId}/read`);
  return response.data;
};
