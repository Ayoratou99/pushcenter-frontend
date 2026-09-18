import { CONFIG } from 'src/config-global';

import { DocumentationView } from 'src/sections/documentation';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`API documentation - ${CONFIG.appName}`}</title>

      <DocumentationView />
    </>
  );
}
