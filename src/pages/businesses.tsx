import { CONFIG } from 'src/config-global';

import { BusinessesView } from 'src/sections/businesses/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Businesses - ${CONFIG.appName}`}</title>
      <meta name="description" content="Manage businesses and accounts" />
      <meta name="keywords" content="businesses,accounts,management" />

      <BusinessesView />
    </>
  );
}

