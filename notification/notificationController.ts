import { Not } from 'typeorm';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/User/user';

const admin = require("firebase-admin");

// Initialize Firebase Admin with Service Account JSON
admin.initializeApp({
  credential: admin.credential.cert(require("./test-f9ed6-firebase-adminsdk-fbsvc-bf064ae1ee.json")), // Path to your Firebase admin SDK file
});

/**
 * Send Push Notification via Firebase Cloud Messaging (FCM)
 * @param {string} deviceToken - The FCM token of the user
 * @param {string} title - The notification title
 * @param {string} body - The notification message
 */
const sendPushNotification = async (deviceToken: string, title: string, body: string) => {
  // const message = {
  //   notification: { title, body },
  //   token: deviceToken,
  // };

  const message = {
    to: deviceToken, // Device FCM Token
    data: { // ✅ Only use `data`, NOT `notification`
      title,
      body,
      icon: "/logo192.png",
      url: "https://centoc.io" // Optional for notification click action
    }
  };

  try {
    await admin.messaging().send(message);
    console.log("✅ Notification sent successfully!");
    return { success: true, message: "Notification sent" };
  } catch (error:any) {
    console.error("❌ Error sending notification:", error);
    return { success: false, error: error.message };
  }
};

const sendPushNotificationToAll = async (title: any, body: any) => {
  try {
    // 🔥 Step 1: Fetch all tokens from your database
    const userRepository = AppDataSource.getRepository(User);

    const usersWithFCMToken = await userRepository.find({
      select: ["id", "fcmtoken"], // Select fields explicitly
      where: {
        fcmtoken: Not("") // Exclude users without FCM tokens
      }
    });
    
    console.log(usersWithFCMToken);
    
    const tokens = usersWithFCMToken.map(user => user.fcmtoken);

    if (tokens.length === 0) {
      console.log("❌ No tokens found.");
      return { success: false, message: "No users to notify" };
    }

    // 🔥 Step 2: Send notification to multiple tokens
    const message:any = {
      tokens,
      data: { // ✅ Only use `data`, NOT `notification`
        title,
        body,
        icon: "/logo192.png",
        url: "https://centoc.io" // Optional for notification click action
      }
    }
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("✅ Notifications sent successfully:", response);

    return { success: true, message: "Notification sent to all users" };
  } catch (error:any) {
    console.error("❌ Error sending notifications:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification,sendPushNotificationToAll };
