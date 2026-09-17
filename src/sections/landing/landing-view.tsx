import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Channels advertised on the landing page.
 *
 * Telegram is on the marketing page but is not implemented in the API yet
 * (`messages.message_type` only accepts email, sms and whatsapp). Drop the
 * entry here the day it should stop being announced.
 */
const CHANNELS = [
  {
    name: 'WhatsApp Business',
    icon: 'mdi:whatsapp',
    color: '#25D366',
    description:
      'Envoyez des messages WhatsApp via AyosPush avec des modèles approuvés et un suivi en temps réel.',
  },
  {
    name: 'Email',
    icon: 'solar:letter-bold',
    color: '#FFFFFF',
    description:
      'Gérez vos campagnes email avec des modèles personnalisables et des configurations SMTP flexibles.',
  },
  {
    name: 'SMS',
    icon: 'solar:smartphone-bold',
    color: '#FFFFFF',
    description: 'Envoyez des SMS via plusieurs opérateurs : Orange, MTN, Airtel et Moov.',
  },
  {
    name: 'Telegram',
    icon: 'mdi:telegram',
    color: '#29B6F6',
    description:
      'Intégrez vos bots Telegram pour envoyer des messages automatisés à vos utilisateurs.',
  },
];

// ----------------------------------------------------------------------

export function LandingView() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: 'common.white',
        background: 'linear-gradient(125deg, #16216B 0%, #1A3F9E 38%, #1558C2 72%, #1565CF 100%)',
      }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ---------------------------------------------------------------- */}
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.14)',
            }}
          >
            <Iconify icon="solar:chat-round-dots-bold" width={26} sx={{ color: 'common.white' }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            AninfPush
          </Typography>
        </Stack>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 6, md: 10 } }}>
        <Box
          sx={{
            display: 'grid',
            alignItems: 'center',
            gap: { xs: 6, md: 4 },
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
          }}
        >
          <Box>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.12,
                fontSize: { xs: 40, sm: 52, md: 62 },
              }}
            >
              Votre plateforme de messagerie
              <Box component="span" sx={{ display: 'block', color: '#5EB3F6' }}>
                multi-canal unifiée
              </Box>
            </Typography>

            <Typography
              sx={{
                mt: 3,
                maxWidth: 520,
                fontSize: { xs: 16, md: 18 },
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              Gérez vos communications WhatsApp, Email, SMS et Telegram depuis une seule interface.
              Connectez-vous pour commencer.
            </Typography>

            <Button
              size="large"
              variant="contained"
              onClick={() => navigate('/sign-in')}
              startIcon={<Iconify icon="solar:login-3-bold" width={22} />}
              sx={{
                mt: 5,
                px: 4,
                py: 1.75,
                fontSize: 17,
                fontWeight: 700,
                borderRadius: 2,
                color: 'common.white',
                bgcolor: '#22C55E',
                boxShadow: '0 0 24px rgba(34,197,94,0.55)',
                '&:hover': {
                  bgcolor: '#16A34A',
                  boxShadow: '0 0 32px rgba(34,197,94,0.7)',
                },
              }}
            >
              Se connecter
            </Button>
          </Box>

          {/* Decorative chat bubble */}
          <Box
            aria-hidden
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 360,
                height: 360,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Iconify
                icon="solar:chat-round-dots-bold"
                width={190}
                sx={{ color: 'rgba(255,255,255,0.32)' }}
              />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* Channels                                                          */}
      {/* ---------------------------------------------------------------- */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Typography
          variant="h4"
          sx={{ mb: { xs: 4, md: 5 }, fontWeight: 800, textAlign: 'center' }}
        >
          Canaux de communication
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
          }}
        >
          {CHANNELS.map((channel) => (
            <Card
              key={channel.name}
              sx={{
                p: 3,
                height: 1,
                borderRadius: 2,
                color: 'common.white',
                bgcolor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: 'none',
                transition: (theme) =>
                  theme.transitions.create(['background-color', 'transform'], { duration: 200 }),
                '&:hover': {
                  transform: 'translateY(-4px)',
                  bgcolor: 'rgba(255,255,255,0.12)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.12)',
                }}
              >
                <Iconify icon={channel.icon} width={26} sx={{ color: channel.color }} />
              </Box>

              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#5EB3F6' }}>
                {channel.name}
              </Typography>

              <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>
                {channel.description}
              </Typography>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
