import React, { useState, useEffect, useMemo } from 'react';

import { MdNotifications } from 'react-icons/md';
import { parseISO, formatDistance } from 'date-fns';
import us from 'date-fns/locale/en-US';

import history from '~/services/history';
import api from '~/services/api';
import adorable from '~/services/adorable';

import colors from '~/styles/colors';

import {
  Container,
  Badge,
  NotificationList,
  Scroll,
  Notification,
  NotificationPicture,
  NotificationContent,
} from './styles';

export default function Notifications() {
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const hasUnread = useMemo(
    () => !!notifications.find(notification => notification.read === false),
    [notifications]
  );

  useEffect(() => {
    let isMounted = true;

    function getTimeDistance(time) {
      return formatDistance(parseISO(time), new Date(), {
        addSuffix: true,
        locale: us,
      });
    }

    function updateNotifications(data) {
      const newData = data.map(notification => ({
        ...notification,
        timeDistance: getTimeDistance(notification.createdAt),
      }));

      if (!isMounted) return;

      setNotifications(newData);
    }

    async function loadNotifications() {
      const response = await api.get('notifications');

      updateNotifications(response.data);

      return setInterval(() => {
        updateNotifications(response.data);
      }, 1000 * 60);
    }

    const updateTask = loadNotifications();

    return () => {
      clearInterval(updateTask);
      isMounted = false;
    };
  }, []);

  function handleToggleVisible() {
    setVisible(!visible);
  }

  async function handleMarkAsRead(id) {
    const {
      data: { _id: success },
    } = await api.put(`notifications/${id}`);

    if (success) {
      setNotifications(
        notifications.map(notification =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  }

  return (
    <Container>
      <Badge hasUnread={hasUnread} onClick={handleToggleVisible}>
        <MdNotifications color={colors.red} size={20} />
      </Badge>

      <NotificationList visible={visible}>
        <Scroll>
          {notifications.map(notification => (
            <Notification
              type="button"
              key={notification._id}
              onClick={() => {
                if (notification.redirects)
                  history.push(notification.redirects);
              }}
              redirects={notification.redirects}
            >
              {notification.picture && (
                <NotificationPicture
                  src={
                    notification.picture === 'adorable'
                      ? adorable(notification.payload.adorable)
                      : notification.picture
                  }
                  alt="Profile Picture"
                />
              )}
              <NotificationContent unread={!notification.read}>
                <p>{notification.content}</p>
                <div>
                  <time>{notification.timeDistance}</time>
                  {!notification.read && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                      type="button"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </NotificationContent>
            </Notification>
          ))}
        </Scroll>
      </NotificationList>
    </Container>
  );
}
