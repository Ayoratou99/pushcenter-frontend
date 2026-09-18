import type { IconButtonProps } from '@mui/material/IconButton';
import type { AppNotification } from 'src/services/notification.service';

import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

import { notificationService } from 'src/services/notification.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** How often the bell refreshes on its own. */
const POLL_INTERVAL_MS = 60_000;

const SEVERITY = {
  error: { icon: 'solar:danger-triangle-bold', color: 'error.main', bg: 'error.lighter' },
  warning: { icon: 'solar:bell-bing-bold-duotone', color: 'warning.main', bg: 'warning.lighter' },
  info: { icon: 'solar:bell-bing-bold-duotone', color: 'info.main', bg: 'info.lighter' },
} as const;

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;

  return `${Math.floor(seconds / 86400)} d ago`;
}

export type NotificationsPopoverProps = IconButtonProps;

/**
 * Operational alerts: failed deliveries, undelivered webhooks, broken SMTP
 * configurations. Derived from live state, so an entry disappears once the
 * underlying problem ages out.
 */
export function NotificationsPopover({ sx, ...other }: NotificationsPopoverProps) {
  const navigate = useNavigate();

  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const feed = await notificationService.getAll();
      setNotifications(feed.notifications);
      setUnread(feed.unread_count);
    } catch {
      // A transient API problem must not break the header.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const timer = setInterval(load, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [load]);

  const handleMarkAllRead = useCallback(async () => {
    setUnread(0);
    setNotifications((previous) => previous.map((item) => ({ ...item, is_unread: false })));

    try {
      await notificationService.markAllRead();
    } catch {
      load();
    }
  }, [load]);

  const handleOpenNotification = useCallback(
    (notification: AppNotification) => {
      setAnchor(null);

      const link = notification.link;

      if (!link) return;

      if (link.view === 'messages') {
        // The list highlights the message named in the query string.
        navigate(`/messages?message_id=${link.message_id ?? ''}`);
      } else if (link.view === 'business' && link.business_id) {
        navigate(`/business/${link.business_id}${link.tab ? `?tab=${link.tab}` : ''}`);
      }
    },
    [navigate]
  );

  return (
    <>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={sx}
        aria-label={`${unread} unread notifications`}
        {...other}
      >
        <Badge badgeContent={unread} color="error" max={99}>
          <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: '100%' } } }}
      >
        <Box sx={{ py: 2, pl: 2.5, pr: 1.5, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">Notifications</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {unread > 0 ? `${unread} unread` : 'Nothing new'}
            </Typography>
          </Box>

          {unread > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton color="primary" onClick={handleMarkAllRead}>
                <Iconify icon="solar:check-circle-bold" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Refresh">
            <IconButton onClick={load}>
              <Iconify icon="solar:restart-bold" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, px: 3 }}>
            <Iconify
              icon="solar:check-circle-bold"
              width={40}
              sx={{ color: 'success.main', mb: 1 }}
            />
            <Typography variant="subtitle2">Everything is running</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Failed deliveries and configuration problems show up here.
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifications.map((notification) => {
              const severity = SEVERITY[notification.severity] ?? SEVERITY.info;

              return (
                <ListItemButton
                  key={notification.id}
                  onClick={() => handleOpenNotification(notification)}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    alignItems: 'flex-start',
                    gap: 2,
                    ...(notification.is_unread && { bgcolor: 'action.selected' }),
                  }}
                >
                  <Avatar sx={{ bgcolor: severity.bg, width: 40, height: 40 }}>
                    <Iconify icon={severity.icon} width={22} sx={{ color: severity.color }} />
                  </Avatar>

                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {notification.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {notification.description}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{ color: 'text.disabled', display: 'flex', gap: 0.75, mt: 0.5 }}
                    >
                      {timeAgo(notification.occurred_at)}
                      {notification.business?.name ? ` · ${notification.business.name}` : ''}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            disableRipple
            color="inherit"
            onClick={() => {
              setAnchor(null);
              navigate('/messages?status=failed');
            }}
          >
            View all failed messages
          </Button>
        </Box>
      </Popover>
    </>
  );
}
