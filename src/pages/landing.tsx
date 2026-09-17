import { CONFIG } from 'src/config-global';

import { LandingView } from 'src/sections/landing';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{CONFIG.appName}</title>
      <meta
        name="description"
        content="Plateforme de messagerie multi-canal : WhatsApp, Email, SMS et Telegram depuis une seule interface."
      />

      <LandingView />
    </>
  );
}
