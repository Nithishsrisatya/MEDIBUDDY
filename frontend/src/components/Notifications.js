import React, { useEffect, useState, useCallback } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Badge,
  Typography,
  Paper,
  Divider,
  Box
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckIcon from '@mui/icons-material/Check';
import { fetchNotifications, markNotificationAsRead } from '../utils/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showList, setShowList] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetchNotifications();
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleList = () => {
    setShowList(!showList);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton onClick={toggleList} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {showList && (
        <Paper
          sx={{
            position: 'absolute',
            top: 50,
            right: 0,
            width: 350,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1000,
            boxShadow: 3
          }}
        >
          <Typography variant="h6" sx={{ p: 2 }}>
            Notifications
          </Typography>
          <Divider />
          <List>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <ListItem key={notification._id} sx={{ alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.createdAt).toLocaleString()}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: notification.read ? 'normal' : 'bold'
                      }
                    }}
                  />
                  {!notification.read && (
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No notifications" />
              </ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Notifications;
