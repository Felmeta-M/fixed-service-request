# Google Maps API Key Security Guide for Production

This guide provides step-by-step instructions for securing your Google Maps API keys in production.

## Overview

Your application uses **two separate API keys** for security:

1. **Frontend Key** (`GOOGLE_MAPS_FRONTEND_KEY`) - Exposed in browser, restricted to Maps JavaScript API only
2. **Server Key** (`GOOGLE_API_KEY` / `GOOGLE_MAPS_SERVER_KEY`) - Never exposed, used for server-side Geocoding API

**⚠️ CRITICAL:** Never use the same key for both frontend and backend. If a frontend key is compromised, it should only allow Maps display, not API access.

---

## Step 1: Create a Separate Frontend API Key

### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**

### 1.2 Create New API Key for Frontend

1. Click **"+ CREATE CREDENTIALS"** → **"API key"**
2. A new API key will be created (you'll see it in the credentials list)
3. Click on the newly created API key to edit it
4. Give it a descriptive name: `Maps Frontend Key - Production` or `Maps JS API Key`

---

## Step 2: Restrict the Frontend API Key

### 2.1 Set Application Restrictions (HTTP Referrers)

**This is the most important security step!**

1. In the API key edit page, under **"Application restrictions"**, select **"HTTP referrers (web sites)"**
2. Click **"+ ADD AN ITEM"** and add your production domains:

   ```
   https://yourdomain.com/*
   https://*.yourdomain.com/*
   https://www.yourdomain.com/*
   ```

   **For subdomains:**
   ```
   https://app.yourdomain.com/*
   https://admin.yourdomain.com/*
   ```

   **Important patterns:**
   - Use `https://` (not `http://`) for production
   - Use `/*` at the end to allow all paths
   - Use `*.yourdomain.com/*` to allow all subdomains
   - **DO NOT** add `localhost` or development URLs here (use a separate dev key)

3. Click **"SAVE"**

### 2.2 Set API Restrictions

1. Under **"API restrictions"**, select **"Restrict key"**
2. Click **"Select APIs"**
3. **ONLY** check these APIs:
   - ✅ **Maps JavaScript API** (required for displaying maps)
   - ✅ **Places API** (if you use place autocomplete/search)
   - ✅ **Geocoding API** (if you need client-side geocoding - but prefer server-side)

4. **DO NOT** enable:
   - ❌ Geocoding API (prefer server-side)
   - ❌ Directions API
   - ❌ Distance Matrix API
   - ❌ Any other APIs not needed in the browser

5. Click **"SAVE"**

### 2.3 Review Restrictions Summary

Your frontend key should show:
- ✅ **Application restrictions:** HTTP referrers (your domains only)
- ✅ **API restrictions:** Maps JavaScript API, Places API (if needed)

---

## Step 3: Secure the Server-Side API Key

### 3.1 Create/Update Server-Side Key

1. In Google Cloud Console → **Credentials**, create a **separate API key** for server-side use
2. Name it: `Maps Server Key - Production` or `Geocoding API Key`

### 3.2 Restrict Server-Side Key

1. **Application restrictions:** Select **"IP addresses"** (if you have fixed server IPs) OR **"None"** (if using dynamic IPs)
   - ⚠️ If using "None", ensure API restrictions are very strict

2. **API restrictions:** Select **"Restrict key"** and **ONLY** enable:
   - ✅ **Geocoding API** (for server-side address lookups)
   - ✅ **Places API** (if used server-side)
   - ❌ **DO NOT** enable Maps JavaScript API (not needed server-side)

3. Click **"SAVE"**

---

## Step 4: Configure Environment Variables

### 4.1 Production `.env` File

Add these variables to your production `.env`:

```env
# ============================================================================
# Google Services - Production
# ============================================================================

# Server-side key (NEVER exposed to browser)
# Used for: Geocoding API, server-side operations
GOOGLE_API_KEY=your_server_side_key_here
GOOGLE_MAPS_SERVER_KEY=your_server_side_key_here

# Frontend key (exposed in browser, but restricted)
# Used for: Maps JavaScript API only
GOOGLE_MAPS_FRONTEND_KEY=your_frontend_key_here

# OAuth (if using Google Sign-In)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 4.2 Verify Configuration

Check that your `config/services.php` correctly reads these:

```php
'google' => [
    'google_api_key' => env('GOOGLE_API_KEY'),
    'maps_server_key' => env('GOOGLE_MAPS_SERVER_KEY'),
    'maps_frontend_key' => env('GOOGLE_MAPS_FRONTEND_KEY', ''),
    // ...
],
```

---

## Step 5: Test the Configuration

### 5.1 Test Frontend Key Restrictions

1. Deploy with the new frontend key
2. Visit your production site
3. Open browser DevTools → Console
4. Check for any API errors
5. **Try accessing the API from a different domain** - it should be blocked

### 5.2 Test Server-Side Key

1. Test geocoding endpoints that use the server-side key
2. Verify they work correctly
3. Check server logs for any API errors

---

## Step 6: Monitor Usage and Set Quotas

### 6.1 Set Usage Quotas

1. Go to **APIs & Services** → **APIs** → Select **Maps JavaScript API**
2. Click **"Quotas"** tab
3. Set daily/monthly quotas to prevent unexpected costs:
   - **Requests per day:** Set based on expected usage
   - **Requests per 100 seconds per user:** Set reasonable limits

### 6.2 Enable Billing Alerts

1. Go to **Billing** → **Budgets & alerts**
2. Create a budget alert to notify you if costs exceed thresholds

### 6.3 Monitor API Usage

1. Go to **APIs & Services** → **Dashboard**
2. Monitor usage graphs for unusual spikes
3. Check **Credentials** → Your API keys → **"Usage"** tab

---

## Step 7: Additional Security Best Practices

### 7.1 Rotate Keys Regularly

- Rotate API keys every 6-12 months
- When rotating, create new keys, update `.env`, deploy, then delete old keys

### 7.2 Use Different Keys for Different Environments

- **Production:** Restricted to production domains only
- **Staging:** Separate key restricted to staging domain
- **Development:** Separate key (can be less restricted, but still restrict APIs)

### 7.3 Never Commit Keys to Git

- ✅ `.env` is in `.gitignore` (verify this)
- ✅ Use environment variables or secrets management
- ❌ Never hardcode keys in source code
- ❌ Never commit `.env` files

### 7.4 Review Access Logs

- Regularly check Google Cloud Console → **APIs & Services** → **Dashboard**
- Look for unusual usage patterns or errors
- Set up alerts for quota limits

---

## Step 8: Troubleshooting

### Issue: "This API key is not authorized"

**Solution:**
- Check that the correct APIs are enabled in API restrictions
- Verify the API is enabled in your Google Cloud project
- Check that billing is enabled (required for most Google Maps APIs)

### Issue: "RefererNotAllowedMapError"

**Solution:**
- Verify your domain is correctly added in HTTP referrer restrictions
- Check for typos in domain names
- Ensure you're using `https://` (not `http://`) in production
- Check that the path pattern matches (e.g., `/*` at the end)

### Issue: Maps not loading

**Solution:**
- Verify `GOOGLE_MAPS_FRONTEND_KEY` is set in `.env`
- Clear Laravel config cache: `php artisan config:clear`
- Check browser console for specific error messages
- Verify the API key is not expired or deleted

---

## Quick Reference Checklist

Before going to production, verify:

- [ ] Created separate frontend and backend API keys
- [ ] Frontend key restricted to HTTP referrers (production domains only)
- [ ] Frontend key restricted to Maps JavaScript API only
- [ ] Server-side key restricted to Geocoding API only
- [ ] Set usage quotas and billing alerts
- [ ] Added keys to production `.env` file
- [ ] Tested maps loading on production domain
- [ ] Verified keys are NOT committed to Git
- [ ] Documented key rotation schedule

---

## Support Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Restricting API Keys](https://cloud.google.com/docs/authentication/api-keys#restricting_apis)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Last Updated:** February 2026
