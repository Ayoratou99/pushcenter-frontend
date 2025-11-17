# Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v20 or higher installed
- ✅ Laravel backend (aninfpush_wsl) running on port 8000
- ✅ Keycloak server configured and running on port 8080

## Quick Start (5 minutes)

### Step 1: Install Dependencies

From WSL terminal:
```bash
cd /home/arthur/aninfpushmanagementfront
npm install --legacy-peer-deps
```

### Step 2: Configure Environment

The `.env` file is already created with default values. Update if needed:
```bash
nano .env
```

### Step 3: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

## Keycloak Configuration

### Create Realm

1. Access Keycloak Admin Console: http://localhost:8080
2. Click **Add Realm**
3. Name: `aninfpush`
4. Click **Create**

### Create Client

1. In the `aninfpush` realm, go to **Clients**
2. Click **Create**
3. Client ID: `aninfpush-frontend`
4. Click **Save**

### Configure Client

Set these values:
- **Access Type**: `public`
- **Valid Redirect URIs**: `http://localhost:5173/*`
- **Web Origins**: `http://localhost:5173`
- **Direct Access Grants Enabled**: `ON`

Click **Save**

### Create Test User

1. Go to **Users** → **Add User**
2. Username: `testuser`
3. Email: `test@aninfpush.com`
4. Save
5. Go to **Credentials** tab
6. Set password: `test123`
7. Disable **Temporary** password option
8. Click **Set Password**

## Testing the Application

1. Open http://localhost:5173
2. You'll be redirected to Keycloak login
3. Login with your test user
4. You'll see the dashboard

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port 5173 already in use
```bash
# Kill the process
npx kill-port 5173
# Or change port in vite.config.ts
```

### Keycloak connection error
- Check Keycloak is running: `curl http://localhost:8080`
- Verify realm and client names match `.env` file
- Check browser console for detailed errors

### API connection error
- Verify Laravel backend is running: `curl http://localhost:8000/api`
- Check `.env` VITE_API_BASE_URL matches backend URL
- Ensure backend has proper CORS configuration

## File Structure Overview

```
aninfpushmanagementfront/
├── src/
│   ├── config/              # ⚙️ Configuration
│   ├── services/            # 🔌 API Services
│   ├── pages/               # 📄 Page Components
│   ├── sections/            # 🧩 Section Components
│   ├── contexts/            # 🔐 Auth Context
│   ├── hooks/               # 🪝 Custom Hooks
│   └── routes/              # 🛤️ Routing
├── .env                     # 🔧 Environment Config
└── package.json             # 📦 Dependencies
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure Keycloak
3. ✅ Start the app
4. 📊 View dashboard at http://localhost:5173
5. 📨 Test Messages page
6. 📝 Test Templates page
7. 🏢 Test Businesses page

## Available API Endpoints

The frontend connects to these backend endpoints:

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-messages` - Recent messages
- `GET /api/dashboard/message-trends` - Message trends
- `GET /api/dashboard/cost-analysis` - Cost analysis

### Messages
- `GET /api/messages` - List messages
- `GET /api/messages/:id` - Get message
- `POST /api/messages/whatsapp` - Send WhatsApp
- `POST /api/messages/sms` - Send SMS  
- `POST /api/messages/email` - Send Email
- `POST /api/messages/:id/retry` - Retry message
- `POST /api/messages/:id/cancel` - Cancel message
- `DELETE /api/messages/:id` - Delete message

### Templates
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/activate` - Activate
- `POST /api/templates/:id/deactivate` - Deactivate

### Businesses
- `GET /api/businesses` - List businesses
- `GET /api/businesses/:id` - Get business
- `POST /api/businesses` - Create business
- `PUT /api/businesses/:id` - Update business
- `DELETE /api/businesses/:id` - Delete business
- `GET /api/businesses/:id/stats` - Business stats

## Development Tips

### Hot Reload
The dev server supports hot module replacement. Changes will reflect instantly.

### TypeScript
Use proper types from `src/services/types/` for type safety.

### Custom Hook
Use `useAuth()` hook to access authentication:
```typescript
import { useAuth } from 'src/hooks/useAuth';

const { user, isAuthenticated, login, logout } = useAuth();
```

### API Calls
```typescript
import { messageService } from 'src/services';

const messages = await messageService.getAll({ page: 1 });
```

## Production Build

```bash
npm run build
npm run start  # Preview production build
```

Deploy the `dist/` directory to your web server.

