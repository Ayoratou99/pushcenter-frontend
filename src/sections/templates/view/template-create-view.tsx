import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { SmsTemplateEditor } from '../editors/sms-template-editor';
import { EmailTemplateEditor } from '../editors/email-template-editor';
import { WhatsAppTemplateEditor } from '../editors/whatsapp-template-editor';

// ----------------------------------------------------------------------

export function TemplateCreateView() {
  const [currentTab, setCurrentTab] = useState('email');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Create Template
        </Typography>
      </Box>

      <Card>
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ px: 3, pt: 2 }}>
          <Tab label="Email Template" value="email" />
          <Tab label="WhatsApp Template" value="whatsapp" />
          <Tab label="SMS Template" value="sms" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {currentTab === 'email' && <EmailTemplateEditor />}
          {currentTab === 'whatsapp' && <WhatsAppTemplateEditor />}
          {currentTab === 'sms' && <SmsTemplateEditor />}
        </Box>
      </Card>
    </DashboardContent>
  );
}

