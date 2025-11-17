import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/useAuth';

import { DashboardContent } from 'src/layouts/dashboard';
import { dashboardService, type DashboardStats } from 'src/services';

import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';

// ----------------------------------------------------------------------

export function AninfPushDashboardView() {
  const { user, isAuthenticated, initialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [messageTrends, setMessageTrends] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('📊 Dashboard View - Auth State:', {
      isAuthenticated,
      initialized,
      user: user?.preferred_username,
    });
  }, [isAuthenticated, initialized, user]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('📊 Loading dashboard data...');
      loadDashboardData();
    } else if (initialized && !isAuthenticated) {
      console.log('⚠️ Not authenticated, user needs to login');
      setLoading(false);
    }
  }, [isAuthenticated, initialized]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats and trends in parallel
      const [statsResponse, trendsResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMessageTrends({ period: 'week' }),
      ]);
      
      setStats(statsResponse.data);
      setMessageTrends(trendsResponse.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  const userName = user?.preferred_username || user?.name || 'User';

  // Transform message trends data for chart
  const transformTrendsData = () => {
    if (!messageTrends || !Array.isArray(messageTrends)) {
      return {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        series: [
          { name: 'Email', data: [0, 0, 0, 0, 0, 0, 0] },
          { name: 'SMS', data: [0, 0, 0, 0, 0, 0, 0] },
          { name: 'WhatsApp', data: [0, 0, 0, 0, 0, 0, 0] },
        ],
      };
    }

    // Get unique dates and sort them
    const dates = [...new Set(messageTrends.map((item: any) => item.date))].sort();
    
    // Format dates as day names (Mon, Tue, etc.)
    const categories = dates.map((date: string) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    // Group data by message type
    const emailData = dates.map((date: string) => {
      const item = messageTrends.find((t: any) => t.date === date && t.message_type === 'email');
      return item ? parseInt(item.count, 10) : 0;
    });

    const smsData = dates.map((date: string) => {
      const item = messageTrends.find((t: any) => t.date === date && t.message_type === 'sms');
      return item ? parseInt(item.count, 10) : 0;
    });

    const whatsappData = dates.map((date: string) => {
      const item = messageTrends.find((t: any) => t.date === date && t.message_type === 'whatsapp');
      return item ? parseInt(item.count, 10) : 0;
    });

    return {
      categories,
      series: [
        { name: 'Email', data: emailData },
        { name: 'SMS', data: smsData },
        { name: 'WhatsApp', data: whatsappData },
      ],
    };
  };

  const chartData = transformTrendsData();

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi {userName}, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        {/* Total Messages */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Messages"
            percent={0}
            total={stats?.total_messages || 0}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        {/* Sent Messages */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Sent Messages"
            percent={0}
            total={stats?.sent_messages || 0}
            color="success"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        {/* Delivered Messages */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Delivered"
            percent={0}
            total={stats?.delivered_messages || 0}
            color="info"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        {/* Failed Messages */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Failed"
            percent={0}
            total={stats?.failed_messages || 0}
            color="error"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        {/* Pending Messages */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Pending"
            percent={0}
            total={stats?.pending_messages || 0}
            color="warning"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        {/* Total Cost */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Cost"
            percent={0}
            total={stats?.total_cost || 0}
            color="secondary"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        {/* Credits Remaining */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Credits Remaining"
            percent={0}
            total={stats?.credits_remaining || 0}
            color="success"
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        {/* Messages by Type */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <AnalyticsCurrentVisits
            title="Messages by Type"
            chart={{
              series: [
                { label: 'Email', value: stats?.messages_by_type.email || 0 },
                { label: 'SMS', value: stats?.messages_by_type.sms || 0 },
                { label: 'WhatsApp', value: stats?.messages_by_type.whatsapp || 0 },
              ],
            }}
          />
        </Grid>

        {/* Messages by Status */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <AnalyticsCurrentVisits
            title="Messages by Status"
            chart={{
              series: [
                { label: 'Pending', value: stats?.messages_by_status.pending || 0 },
                { label: 'Sent', value: stats?.messages_by_status.sent || 0 },
                { label: 'Delivered', value: stats?.messages_by_status.delivered || 0 },
                { label: 'Failed', value: stats?.messages_by_status.failed || 0 },
              ],
            }}
          />
        </Grid>

        {/* Message Trends - Real Data */}
        <Grid size={{ xs: 12, lg: 12 }}>
          <AnalyticsWebsiteVisits
            title="Message Activity"
            subheader="Last 7 days"
            chart={chartData}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}

