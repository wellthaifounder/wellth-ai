# PWA Testing Guide - Wellth.ai

**Version:** 1.0  
**Last Updated:** November 6, 2025

This guide provides step-by-step instructions to test the Progressive Web App (PWA) functionality of Wellth.ai across different platforms.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [iOS Safari Testing](#ios-safari-testing)
3. [Android Chrome Testing](#android-chrome-testing)
4. [Offline Functionality Testing](#offline-functionality-testing)
5. [Update Notifications Testing](#update-notifications-testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Devices/Browsers
- **iOS Device** (iPhone/iPad) running iOS 14+ with Safari
- **Android Device** running Android 8+ with Chrome 90+
- **Desktop Browser** (Chrome/Edge) for comparison

### Before Testing
1. ✅ App deployed to production/staging URL
2. ✅ HTTPS enabled (required for PWA)
3. ✅ Clear browser cache before starting
4. ✅ Test with fresh incognito/private window for baseline

---

## iOS Safari Testing

### Installation Flow

#### Step 1: Access the App
1. Open Safari on your iPhone/iPad
2. Navigate to: `https://your-wellth-domain.com`
3. Wait for the page to fully load

#### Step 2: Custom Install Prompt (30 seconds)
✅ **Expected Behavior:**
- After 30 seconds, a custom install card should appear in the bottom-right
- Card displays:
  - "Install Wellth" title
  - Benefits: Works offline, Faster load times, Native app experience
  - "How to Install" button
  - "Not Now" dismiss button

🔍 **What to Check:**
- [ ] Install prompt appears after 30-second delay
- [ ] Card design matches app theme (teal primary color)
- [ ] All text is readable and properly formatted
- [ ] Buttons are tappable (minimum 44x44px)

#### Step 3: Manual Installation
Since iOS doesn't support automatic install prompts, test the manual process:

1. **Tap the Share button** (box with arrow pointing up) in Safari toolbar
2. **Scroll down** and find "Add to Home Screen"
3. **Tap "Add to Home Screen"**
4. **Customize the name** (default: "Wellth")
5. **Tap "Add"** in top-right corner

✅ **Expected Behavior:**
- App icon appears on home screen
- Icon uses `/wellth-icon.png`
- App name displays as "Wellth"

#### Step 4: Launch Installed App
1. **Tap the Wellth icon** on home screen
2. App should open in **standalone mode** (no Safari UI)

✅ **Expected Behavior:**
- [ ] App opens fullscreen (no Safari address bar)
- [ ] Status bar shows app theme color (#14b8a6 - teal)
- [ ] App loads normally with all functionality
- [ ] Navigation works correctly
- [ ] No install prompt shown (app knows it's installed)

#### Step 5: iOS Standalone Features
🔍 **Test These Features:**
- [ ] **Deep Links:** Tap links to other pages, should stay in app
- [ ] **App Switcher:** Double-tap home, app appears with proper icon
- [ ] **Orientation:** Locks to portrait mode (as configured)
- [ ] **Splash Screen:** Shows briefly on launch (if configured)

---

## Android Chrome Testing

### Installation Flow

#### Step 1: Access the App
1. Open Chrome on your Android device
2. Navigate to: `https://your-wellth-domain.com`
3. Wait for page to fully load

#### Step 2: Auto Install Prompt (30 seconds)
✅ **Expected Behavior:**
- After 30 seconds, a custom install card appears
- Card displays:
  - "Install Wellth" title with download icon
  - Benefits list
  - "Install App" button (triggers browser install)
  - "Not Now" dismiss button

🔍 **What to Check:**
- [ ] Custom prompt appears after 30-second delay
- [ ] Card design is responsive and readable
- [ ] Dismiss button hides prompt
- [ ] localStorage prevents re-showing for 7 days after dismiss

#### Step 3: Browser Install Prompt
After clicking "Install App":

✅ **Expected Behavior:**
- Native Chrome install dialog appears
- Dialog shows:
  - App name: "Wellth.ai - HSA & Healthcare Financial Manager"
  - App icon
  - Source URL
  - "Install" and "Cancel" buttons

#### Step 4: Install the App
1. **Tap "Install"** in Chrome dialog
2. Wait for installation to complete

✅ **Expected Behavior:**
- [ ] Toast notification: "App installed successfully!"
- [ ] Custom install prompt disappears
- [ ] App icon added to home screen automatically
- [ ] App icon added to app drawer

#### Step 5: Launch Installed App
1. **Tap Wellth icon** from home screen or app drawer
2. App opens in standalone mode

✅ **Expected Behavior:**
- [ ] App opens fullscreen (no Chrome URL bar)
- [ ] Theme color (#14b8a6) in status bar
- [ ] All features work normally
- [ ] Fast startup (cached assets)

#### Step 6: Android-Specific Features
🔍 **Test These Features:**
- [ ] **Add to Home Screen:** Long-press app, add to home
- [ ] **Recent Apps:** Appears in task switcher with icon
- [ ] **Notifications:** (if implemented) Permission prompt works
- [ ] **Share Target:** (if implemented) App appears in share menu

---

## Offline Functionality Testing

### Test Offline Mode

#### Preparation
1. Install the app on device (follow iOS or Android steps above)
2. Open the app and browse several pages:
   - Dashboard
   - Transactions
   - Analytics
   - HSA Eligibility Guide
3. Ensure all pages load fully

#### Test Offline Access

##### Method 1: Airplane Mode
1. **Enable Airplane Mode** on device
2. **Close the app completely** (swipe away from recent apps)
3. **Relaunch the app**

✅ **Expected Behavior:**
- [ ] App launches successfully
- [ ] Landing page loads from cache
- [ ] Images and icons display correctly
- [ ] Fonts load properly (Google Fonts cached)
- [ ] Static pages are fully accessible

##### Method 2: Network Throttling (Chrome DevTools)
On desktop Chrome:
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"
4. Reload the page

✅ **Expected Behavior:**
- [ ] Page loads from cache
- [ ] Service worker serves cached assets
- [ ] No broken images or missing resources

#### Test API Calls Offline
1. With app offline, try to:
   - Load Dashboard (requires Supabase)
   - View Transactions (requires Supabase)

✅ **Expected Behavior:**
- [ ] UI loads from cache
- [ ] Loading states appear for data
- [ ] Graceful error messages shown:
  - "Unable to load data. Please check your connection."
  - "You're offline. Some features may be limited."
- [ ] **No crashes or blank screens**

#### Test Coming Back Online
1. **Disable Airplane Mode**
2. **Refresh or navigate** in the app

✅ **Expected Behavior:**
- [ ] App detects connection restored
- [ ] Data fetches automatically
- [ ] Cached data updates with fresh data
- [ ] Smooth transition (no jarring reloads)

---

## Update Notifications Testing

### Trigger an Update

#### Step 1: Deploy New Version
1. Make a small change to the app (e.g., update a text string)
2. Build and deploy the new version
3. Wait for deployment to complete

#### Step 2: Test Update Prompt (Existing Users)
1. **Keep the old version open** on your device
2. Wait a few minutes (service worker checks for updates periodically)
3. **Navigate between pages** (triggers update check)

✅ **Expected Behavior:**
- [ ] Update prompt card appears at top of screen
- [ ] Card shows:
  - Amber/orange warning color
  - "Update Available" title with refresh icon
  - "Update Now" button
  - "Later" dismiss button
- [ ] Card is dismissible
- [ ] Toast notification if dismissed: "You can update later"

#### Step 3: Accept Update
1. **Tap "Update Now"** button

✅ **Expected Behavior:**
- [ ] Page refreshes automatically
- [ ] New version loads
- [ ] All features work correctly
- [ ] Update prompt doesn't reappear

#### Step 4: Decline Update
1. **Tap "Later"** button

✅ **Expected Behavior:**
- [ ] Prompt dismisses
- [ ] App continues with old version
- [ ] Prompt may reappear on next session

---

## Service Worker Testing

### Verify Service Worker Registration

#### Desktop Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in sidebar

✅ **Expected Status:**
- [ ] Service Worker registered for origin
- [ ] Status: "activated and running"
- [ ] Scope: "/"
- [ ] Update on reload available

#### Check Cached Assets
In DevTools Application tab:
1. Click **Cache Storage**
2. Expand available caches

✅ **Expected Caches:**
- [ ] `workbox-precache-v2-[hash]` - Precached app shell
- [ ] `google-fonts-cache` - Google Fonts
- [ ] `gstatic-fonts-cache` - Font files
- [ ] `supabase-api-cache` - API responses (if visited authenticated pages)

#### Verify Caching Strategy
In Network tab with cache disabled:
1. Load the app
2. Check Network tab for:
   - Cache hits (from ServiceWorker)
   - Network requests (API calls)

✅ **Expected Behavior:**
- [ ] Static assets served from cache (instant)
- [ ] API calls go to network (fresh data)
- [ ] Fonts cached (CacheFirst strategy)

---

## Performance Testing

### Lighthouse Audit
1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select:
   - ✅ Performance
   - ✅ Progressive Web App
   - ✅ Accessibility
4. Click **Analyze page load**

✅ **Target Scores:**
- [ ] **PWA Score:** 100 (all checks passing)
- [ ] **Performance:** 90+ (mobile), 95+ (desktop)
- [ ] **Accessibility:** 100
- [ ] **Install able:** ✓ (green checkmark)
- [ ] **Offline ready:** ✓ (green checkmark)

### PWA Checklist (Lighthouse)
✅ **Must Pass:**
- [ ] Registers a service worker
- [ ] Responds with 200 when offline
- [ ] Has a `<meta name="viewport">` tag
- [ ] Uses HTTPS
- [ ] Redirects HTTP to HTTPS
- [ ] Provides a valid apple-touch-icon
- [ ] Configured for a custom splash screen
- [ ] Sets theme color
- [ ] Content sized correctly for viewport
- [ ] Has a `<meta name="theme-color">` tag
- [ ] Provides a valid manifest

---

## Platform-Specific Checks

### iOS Safari
🔍 **Verify These:**
- [ ] Status bar style: `black-translucent`
- [ ] App runs in fullscreen (no Safari UI)
- [ ] Home screen icon displays correctly
- [ ] App title shows as "Wellth" under icon
- [ ] Orientation locked to portrait
- [ ] No iOS "Open in Safari" button visible

### Android Chrome
🔍 **Verify These:**
- [ ] Install banner prompt works
- [ ] App appears in app drawer
- [ ] Theme color in task switcher
- [ ] Splash screen displays (brief)
- [ ] Status bar matches theme color
- [ ] Can uninstall from app info

---

## Common Issues & Solutions

### Issue: Install Prompt Doesn't Appear

**Possible Causes:**
1. ❌ Already installed
2. ❌ Dismissed within last 7 days
3. ❌ Not on HTTPS
4. ❌ Manifest issues

**Solutions:**
- Clear browser cache and localStorage
- Check manifest.json is accessible
- Verify HTTPS certificate is valid
- Wait 30 seconds after page load

### Issue: App Won't Install on iOS

**Possible Causes:**
1. ❌ Not using Safari browser
2. ❌ Private browsing mode
3. ❌ iOS restrictions

**Solutions:**
- Use Safari (not Chrome on iOS)
- Exit private browsing
- Manually add via Share → Add to Home Screen

### Issue: Offline Mode Not Working

**Possible Causes:**
1. ❌ Service worker not registered
2. ❌ Cache size exceeded
3. ❌ Mixed content warnings

**Solutions:**
- Check Service Worker in DevTools
- Verify HTTPS throughout
- Check console for errors
- Clear cache and re-cache

### Issue: Update Prompt Not Showing

**Possible Causes:**
1. ❌ No new version deployed
2. ❌ Service worker not detecting change
3. ❌ Browser cache preventing update

**Solutions:**
- Hard refresh (Cmd/Ctrl + Shift + R)
- Unregister service worker in DevTools
- Check deployment timestamp
- Wait longer (update check is periodic)

---

## Testing Checklist Summary

### ✅ Installation
- [ ] iOS manual install works
- [ ] Android auto-prompt works
- [ ] Custom prompt appears after 30s
- [ ] App icon displays correctly
- [ ] Launches in standalone mode

### ✅ Offline
- [ ] Loads without network
- [ ] Cached pages accessible
- [ ] Graceful error handling
- [ ] Reconnection works smoothly

### ✅ Updates
- [ ] Update prompt appears
- [ ] Update applies correctly
- [ ] Dismiss works
- [ ] No data loss on update

### ✅ Performance
- [ ] Lighthouse PWA score: 100
- [ ] Fast initial load
- [ ] Smooth navigation
- [ ] No layout shifts

---

## Reporting Issues

If you encounter issues during testing, please document:

1. **Device/Browser:**
   - Model/OS version
   - Browser version
   
2. **Steps to Reproduce:**
   - Exact sequence of actions
   - Screenshots/recordings
   
3. **Expected vs Actual:**
   - What should happen
   - What actually happened
   
4. **Console Errors:**
   - Browser console logs
   - Network tab failures

---

## Next Steps After Testing

Once testing is complete:

1. ✅ **Document Results:** Note any failures or issues
2. 🔧 **Fix Issues:** Address any problems found
3. 📊 **Monitor Analytics:** Track install rates and usage
4. 🚀 **Promote PWA:** Educate users about installation benefits
5. 📱 **Add Install Button:** Consider adding persistent install CTA in UI

---

**Happy Testing! 🎉**
