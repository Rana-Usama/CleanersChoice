#!/bin/bash

# Backup original
cp node_modules/@notifee/react-native/android/build.gradle node_modules/@notifee/react-native/android/build.gradle.backup

# Replace the dependency version
sed -i '' "s/implementation 'app\.notifee:core:+'/implementation 'app.notifee:core:202108261754'/" node_modules/@notifee/react-native/android/build.gradle

echo "Notifee build.gradle patched successfully!"
