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
const sendPushNotification = async (deviceToken, title, body) => {
  const message = {
    notification: { title, body },
    token: deviceToken,
  };

  try {
    await admin.messaging().send(message);
    console.log("✅ Notification sent successfully!");
    return { success: true, message: "Notification sent" };
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification };
