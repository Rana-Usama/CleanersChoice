# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# Keep Google Play Services classes
-keep class com.google.android.gms.** { *; }
-keep interface com.google.android.gms.** { *; }

# Keep Google Places SDK classes
-keep class com.google.android.libraries.places.** { *; }
-keep interface com.google.android.libraries.places.** { *; }

# Keep annotations (sometimes needed for SDK)
-keepattributes *Annotation*

# Optional: Keep Gson models if you are parsing JSON
-keep class com.google.gson.** { *; }
