import { CONFIG } from 'src/config-global';

import { ProfileView } from 'src/sections/profile';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Profile - ${CONFIG.appName}`}</title>

      <ProfileView />
    </>
  );
}
