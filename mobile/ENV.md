# Environment Variables

Set these in `mobile/.env` or in your deployment platform (e.g. Vibecode ENV tab).

## EXPO_PUBLIC_BACKEND_URL

**Required** for API calls (apps, developer, push, etc.).

- **Local dev**: `http://localhost:3000` or your machine's IP (e.g. `http://192.168.1.x:3000`)
- **Vibecode**: Your backend URL from the project (e.g. `https://your-app.vibecode.run`)
- **Production**: Your deployed backend URL

## EXPO_PUBLIC_EAS_PROJECT_ID

**Required for push notifications** — used to fetch the Expo push token.

**Where to get it:**

1. **Expo Dashboard**  
   [expo.dev](https://expo.dev) → Your project → Project settings. The Project ID is shown there.

2. **EAS CLI**
   ```bash
   npx eas project:info
   ```
   Or after linking: `eas init` adds it to `app.json` under `extra.eas.projectId`.

3. **app.json**  
   If you've run `eas init`, it may already be in `app.json` as `extra.eas.projectId`. The app can fall back to `expo-constants` (`Constants.expoConfig?.extra?.eas?.projectId`) when this env var is not set.

## Example .env

```env
EXPO_PUBLIC_BACKEND_URL=https://your-app.vibecode.run
EXPO_PUBLIC_EAS_PROJECT_ID=your-project-id-from-expo-dashboard
```
