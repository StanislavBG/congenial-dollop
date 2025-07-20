# iOS Deployment Guide

## Prerequisites

1. **Xcode** installed on macOS
2. **Apple Developer Account** (for App Store deployment)
3. **Node.js** and npm

## Setup Steps

### 1. Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
```

### 2. Initialize Capacitor
```bash
npx cap init "Congenial Dollop Game" "com.congenialdollop.game"
```

### 3. Add iOS Platform
```bash
npx cap add ios
```

### 4. Build and Sync
```bash
npm run build
npx cap sync ios
```

### 5. Open in Xcode
```bash
npx cap open ios
```

## iOS Configuration

### App Icon
- Replace `ios/App/App/Assets.xcassets/AppIcon.appiconset/` with your app icons
- Use [App Icon Generator](https://appicon.co/) to generate all required sizes

### Splash Screen
- Customize `ios/App/App/Assets.xcassets/SplashScreenBackground.imageset/`
- Update `ios/App/App/Info.plist` for splash screen settings

### Bundle Identifier
- Update `ios/App/App.xcodeproj/project.pbxproj` with your bundle ID
- Example: `com.yourcompany.congenialdollopgame`

## App Store Deployment

### 1. Archive Build
- In Xcode: Product → Archive
- Select "Any iOS Device" as target

### 2. Upload to App Store Connect
- Use Xcode Organizer to upload
- Or use `xcodebuild` command line tools

### 3. App Store Connect Setup
- Create new app in App Store Connect
- Fill in app metadata, screenshots, description
- Submit for review

## Development Commands

```bash
# Build web assets
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Live reload (development)
npx cap run ios -l --external
```

## Mobile Optimizations

- **Touch Controls**: Game automatically detects mobile and switches to touch controls
- **Responsive Design**: Game scales to fit different screen sizes
- **Performance**: Optimized for mobile WebView performance
- **Orientation**: Supports both portrait and landscape

## Troubleshooting

### Common Issues:
1. **Build Errors**: Run `npx cap sync ios` after any dependency changes
2. **Simulator Issues**: Reset simulator or use physical device
3. **Performance**: Check WebView console for errors
4. **Touch Events**: Ensure touch events are properly handled

### Debug Commands:
```bash
# Check Capacitor status
npx cap doctor

# Clean and rebuild
rm -rf ios/App
npx cap add ios
npx cap sync ios
```

## Quick Start for iOS Development

```bash
# 1. Install dependencies
npm install @capacitor/core @capacitor/cli @capacitor/ios

# 2. Initialize Capacitor
npx cap init "Congenial Dollop Game" "com.congenialdollop.game"

# 3. Add iOS platform
npx cap add ios

# 4. Build and sync
npm run build
npx cap sync ios

# 5. Open in Xcode
npx cap open ios
```

## Notes

- The game is already optimized for mobile with touch controls
- Capacitor will create a native iOS wrapper around your web game
- You can test on iOS Simulator or physical device
- App Store deployment requires Apple Developer Program membership ($99/year) 