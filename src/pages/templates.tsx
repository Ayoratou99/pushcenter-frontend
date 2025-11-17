import { CONFIG } from 'src/config-global';

import { TemplatesView } from 'src/sections/templates/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Templates - ${CONFIG.appName}`}</title>
      <meta name="description" content="Manage message templates" />
      <meta name="keywords" content="templates,email,sms,whatsapp" />

      <TemplatesView />
    </>
  );
}

