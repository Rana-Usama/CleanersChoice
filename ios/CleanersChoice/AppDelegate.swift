import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging
import UserNotifications
import RNNotifee

@main
class AppDelegate: RCTAppDelegate,
  UNUserNotificationCenterDelegate,
  MessagingDelegate {

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {

    // Configure Firebase
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    // Register for push notifications
    UNUserNotificationCenter.current().delegate = self
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(options: authOptions) { granted, error in
      print("Push permission granted: \(granted)")
    }
    application.registerForRemoteNotifications()

    // FCM delegate
    Messaging.messaging().delegate = self

    // RN base setup
    self.moduleName = "CleanersChoice"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // MARK: - APNs Token → Firebase
  override func application(_ application: UIApplication,
  didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
  }

  // MARK: - Foreground push handling
  func userNotificationCenter(_ center: UNUserNotificationCenter,
   willPresent notification: UNNotification,
   withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .sound, .badge])
  }

  // MARK: - FCM token refresh
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("📲 FCM registration token: \(String(describing: fcmToken))")
    // 👉 send `fcmToken` to your server if you need to target this device
  }

  // MARK: - RN bundle URL
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    return self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
