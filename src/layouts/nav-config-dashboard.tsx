import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  /** Roles allowed to see the entry; undefined means everyone. */
  roles?: string[];
};

export const navData: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
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
    title: 'Applications',
    path: '/businesses',
    icon: <Iconify icon="solar:shop-bold" width={24} />,
  },
  {
    title: 'API docs',
    path: '/documentation',
    icon: <Iconify icon="solar:book-bookmark-bold" width={24} />,
  },
  {
    title: 'Users',
    path: '/users',
    icon: <Iconify icon="solar:users-group-rounded-bold" width={24} />,
    roles: ['admin'],
  },
];
