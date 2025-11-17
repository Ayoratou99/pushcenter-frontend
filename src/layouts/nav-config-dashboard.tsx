import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <Iconify icon="solar:graph-up-bold" width={24} />,
  },
  {
    title: 'Messages',
    path: '/messages',
    icon: <Iconify icon="solar:chat-round-dots-bold" width={24} />,
  },
  {
    title: 'Templates',
    path: '/templates',
    icon: <Iconify icon="solar:document-text-bold" width={24} />,
  },
  {
    title: 'Businesses',
    path: '/businesses',
    icon: <Iconify icon="solar:shop-bold" width={24} />,
  },
];
