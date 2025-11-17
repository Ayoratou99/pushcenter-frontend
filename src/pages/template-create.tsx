import { CONFIG } from 'src/config-global';

import { TemplateCreateView } from 'src/sections/templates/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Create Template - ${CONFIG.appName}`}</title>
      <meta name="description" content="Create new message template" />
      <meta name="keywords" content="template,create,email,sms,whatsapp" />

      <TemplateCreateView />
    </>
  );
}

