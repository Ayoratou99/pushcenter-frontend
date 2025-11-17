import { CONFIG } from 'src/config-global';

import { MessagesView } from 'src/sections/messages/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Messages - ${CONFIG.appName}`}</title>
      <meta name="description" content="View and manage all messages" />
      <meta name="keywords" content="messages,email,sms,whatsapp" />

      <MessagesView />
    </>
  );
}

