import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

// Doctor availability toggle online/offline
export const updateDoctorOnlineStatus = async (doctorId, online) => {
  const response = await axios.patch(
    `${API_BASE_URL}/doctors/${doctorId}/online`,
    { online },
    getAuthHeaders()
  );
  return response.data;
};

// Fetch notifications for current user
export const fetchNotifications = async (unreadOnly = false) => {
  const response = await axios.get(
    `${API_BASE_URL}/notifications?unreadOnly=${unreadOnly}`,
    getAuthHeaders()
  );
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  const response = await axios.patch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {},
    getAuthHeaders()
  );
  return response.data;
};
