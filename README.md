# AninfPush Management Frontend

A modern React-based management dashboard for the AninfPush messaging platform. Built with Material-UI, TypeScript, and Keycloak authentication.

## Features

- 🔐 **Keycloak Authentication** - Secure SSO integration
- 📊 **Dashboard Analytics** - Real-time messaging statistics and insights
- 📨 **Message Management** - View and manage Email, SMS, and WhatsApp messages
- 📝 **Template Management** - Create and manage message templates
- 🏢 **Business Management** - Manage multiple business accounts
- 🎨 **Modern UI** - Built with Material-UI v7 and latest design patterns
- ⚡ **Fast Performance** - Vite-powered development and build
- 🔄 **Real-time Updates** - API integration with Laravel backend

## Tech Stack

- **React 19** - Latest React with improved performance
- **TypeScript** - Type-safe development
- **Material-UI v7** - Modern component library
- **Vite** - Next generation frontend tooling
- **Keycloak** - Authentication and authorization
- **Axios** - HTTP client for API calls
- **React Router v7** - Client-side routing
- **ApexCharts** - Beautiful data visualizations

## Prerequisites

- Node.js >= 20
- npm or yarn
- Keycloak server running (default: http://localhost:8080)
- AninfPush Laravel backend (default: http://localhost:8000)

## Installation

1. **Clone or navigate to the project:**
   ```bash
   cd /home/arthur/aninfpushmanagementfront
   ```

2. **Install dependencies:**
   ```bash
   # Using npm (from within WSL or native Linux)
   npm install --legacy-peer-deps
   
   # Or using yarn
   yarn install
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and update the values:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_API_TIMEOUT=30000

   # Keycloak Configuration
   VITE_KEYCLOAK_URL=http://localhost:8080
   VITE_KEYCLOAK_REALM=aninfpush
   VITE_KEYCLOAK_CLIENT_ID=aninfpush-frontend

   # App Configuration
   VITE_APP_NAME=AninfPush Management
   VITE_APP_VERSION=1.0.0
   ```

## Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Project Structure

```
aninfpushmanagementfront/
├── src/
│   ├── config/              # Configuration files
│   │   ├── env.config.ts    # Environment variables
│   │   └── keycloak.config.ts  # Keycloak setup
│   ├── contexts/            # React contexts
│   │   └── KeycloakProvider.tsx  # Auth provider
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts       # Authentication hook
│   ├── services/            # API services
│   │   ├── api.client.ts    # Axios client with interceptors
│   │   ├── business.service.ts
│   │   ├── message.service.ts
│   │   ├── template.service.ts
│   │   ├── dashboard.service.ts
│   │   └── types/           # TypeScript types
│   ├── pages/               # Page components
│   │   ├── dashboard.tsx
│   │   ├── messages.tsx
│   │   ├── templates.tsx
│   │   └── businesses.tsx
│   ├── sections/            # Section components
│   │   ├── overview/        # Dashboard views
│   │   ├── messages/        # Message management
│   │   ├── templates/       # Template management
│   │   └── businesses/      # Business management
│   ├── layouts/             # Layout components
│   │   └── dashboard/       # Main dashboard layout
│   ├── routes/              # Routing configuration
│   │   └── sections.tsx     # Route definitions
│   ├── components/          # Reusable components
│   ├── theme/               # MUI theme configuration
│   └── main.tsx             # Application entry point
├── public/                  # Static assets
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── README.md                # This file
```

## API Services

### Authentication
The app uses Keycloak for authentication. The token is automatically included in all API requests.

### API Client
- Automatic token refresh on 401 errors
- Request/response interceptors
- Error handling
- TypeScript typed responses

### Available Services

1. **Dashboard Service**
   - `getStats()` - Get dashboard statistics
   - `getRecentMessages()` - Get recent messages
   - `getMessageTrends()` - Get message trends
   - `getCostAnalysis()` - Get cost analysis

2. **Message Service**
   - `getAll()` - List all messages
   - `getById()` - Get message details
   - `sendWhatsApp()` - Send WhatsApp message
   - `sendSms()` - Send SMS message
   - `sendEmail()` - Send Email message
   - `retry()` - Retry failed message
   - `cancel()` - Cancel pending message

3. **Template Service**
   - `getAll()` - List all templates
   - `getById()` - Get template details
   - `create()` - Create new template
   - `update()` - Update template
   - `delete()` - Delete template
   - `activate()` / `deactivate()` - Toggle template status

4. **Business Service**
   - `getAll()` - List all businesses
   - `getById()` - Get business details
   - `create()` - Create new business
   - `update()` - Update business
   - `delete()` - Delete business
   - `getStats()` - Get business statistics

## Keycloak Setup

1. Create a realm named `aninfpush` in your Keycloak instance
2. Create a client with ID `aninfpush-frontend`
3. Configure the client:
   - Access Type: public
   - Valid Redirect URIs: `http://localhost:5173/*`
   - Web Origins: `http://localhost:5173`
   - Enable "Direct Access Grants"

## Navigation

The dashboard includes the following sections:

- **Dashboard** - Overview with statistics and charts
- **Messages** - View and manage all messages (Email, SMS, WhatsApp)
- **Templates** - Manage message templates
- **Businesses** - Manage business accounts
- **User** - User management (from template)
- **Product** - Product management (from template)
- **Blog** - Blog management (from template)

## Development Notes

### WSL Users
If you encounter permission issues with npm, use the following:
```bash
# Install from native WSL terminal, not through Windows
cd /home/arthur/aninfpushmanagementfront
npm install --legacy-peer-deps
```

### React 19 Compatibility
The project uses React 19 which may require `--legacy-peer-deps` flag for some packages that haven't updated their peer dependencies yet.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run fm:check` - Check Prettier formatting
- `npm run fm:fix` - Fix Prettier formatting
- `npm run fix:all` - Run lint:fix and fm:fix

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the application.

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | http://localhost:8000/api |
| VITE_API_TIMEOUT | API request timeout (ms) | 30000 |
| VITE_KEYCLOAK_URL | Keycloak server URL | http://localhost:8080 |
| VITE_KEYCLOAK_REALM | Keycloak realm name | aninfpush |
| VITE_KEYCLOAK_CLIENT_ID | Keycloak client ID | aninfpush-frontend |
| VITE_APP_NAME | Application name | AninfPush Management |
| VITE_APP_VERSION | Application version | 1.0.0 |

## License

MIT

## Support

For issues and questions, please contact the development team.
