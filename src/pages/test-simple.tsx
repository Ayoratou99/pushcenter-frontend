import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

// Simple test page WITHOUT Keycloak to verify React is working

export default function TestSimplePage() {
  console.log('🧪 Simple Test Page - Component Mounted');

  const handleClick = () => {
    alert('React is working! ✅');
    console.log('✅ Button clicked - React is functional');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card sx={{ p: 4, maxWidth: 600 }}>
        <Typography variant="h3" sx={{ mb: 3, color: 'success.main' }}>
          ✅ React is Working!
        </Typography>

        <Typography variant="body1" sx={{ mb: 2 }}>
          If you can see this page, it means:
        </Typography>

        <Box component="ul" sx={{ mb: 3 }}>
          <li>✅ React is rendering correctly</li>
          <li>✅ Material-UI components are working</li>
          <li>✅ Routing is functional</li>
          <li>✅ Vite dev server is running</li>
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleClick}
          sx={{ mb: 2 }}
        >
          Click to Test Interactivity
        </Button>

        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={() => {
            window.location.href = '/test-auth';
          }}
        >
          Go to Auth Test Page
        </Button>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            <strong>Current URL:</strong> {window.location.href}
            <br />
            <strong>Timestamp:</strong> {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}

