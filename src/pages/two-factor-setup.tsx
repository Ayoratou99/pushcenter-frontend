import { CONFIG } from 'src/config-global';

import { TwoFactorSetupView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Two-factor setup - ${CONFIG.appName}`}</title>

      <TwoFactorSetupView />
    </>
  );
}
