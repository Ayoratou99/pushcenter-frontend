import type { HorizonStatus } from 'src/services/system.service';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';

import { systemService } from 'src/services/system.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Horizon's heartbeat expires after 15 s, so polling faster buys nothing.
 */
const POLL_INTERVAL_MS = 20_000;

const SEVERITY = {
  inactive: 'error',
  paused: 'warning',
  unknown: 'warning',
  running: 'warning', // only shown when running but falling behind
} as const;

const TITLE = {
  inactive: 'Queue worker stopped',
  paused: 'Queue worker paused',
  unknown: 'Queue worker status unknown',
  running: 'Queue is falling behind',
} as const;

/**
 * Warns when the queue worker is not processing jobs.
 *
 * It matters because everything outbound goes through the queue: with Horizon
 * down, messages are accepted and marked "queued" but never actually sent.
 * Nothing is shown while things are healthy.
 */
export function HorizonBanner() {
  const [status, setStatus] = useState<HorizonStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await systemService.horizon();

      setStatus(next);

      // A recovered worker brings the banner back for the next problem.
      if (next.healthy) {
        setDismissed(false);
      }
    } catch {
      // The API being unreachable is already visible elsewhere; do not stack
      // another banner on top of it.
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    load();

    const timer = setInterval(load, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [load]);

  const show = !!status && !status.healthy && !dismissed;

  return (
    <Collapse in={show} unmountOnExit>
      <Alert
        severity={status ? SEVERITY[status.status] : 'warning'}
        icon={<Iconify icon="solar:danger-triangle-bold" />}
        sx={{ borderRadius: 0, alignItems: 'center' }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button color="inherit" size="small" onClick={load}>
              Check again
            </Button>
            <Button color="inherit" size="small" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
          </Box>
        }
      >
        <Typography variant="subtitle2" component="span" sx={{ mr: 1 }}>
          {status ? TITLE[status.status] : 'Queue worker'}
        </Typography>

        <Typography variant="body2" component="span">
          {status?.message}
          {status && status.pending_jobs > 0
            ? ` ${status.pending_jobs} job${status.pending_jobs > 1 ? 's' : ''} waiting.`
            : ''}
        </Typography>
      </Alert>
    </Collapse>
  );
}
