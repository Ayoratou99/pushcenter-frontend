import { CONFIG } from 'src/config-global';

import { AninfPushDashboardView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Dashboard - ${CONFIG.appName}`}</title>
      <meta
        name="description"
        content="AninfPush Management Dashboard - Monitor and manage your email, SMS, and WhatsApp messages"
      />
      <meta name="keywords" content="messaging,dashboard,email,sms,whatsapp,notifications" />

      <AninfPushDashboardView />
    </>
  );
}
