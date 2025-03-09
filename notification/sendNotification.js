const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require("./firebase-adminsdk.json")),
});

const sendPushNotification = async (deviceToken) => {
  if (!deviceToken) {
    console.error("❌ No device token provided!");
    return;
  }

  const message = {
    notification: {
      title: "New Message!",
      body: "You have a new notification!",
    },
    token: deviceToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent successfully!", response);
  } catch (error) {
    console.error("❌ Error sending notification:", error);
  }
};

// 🔹 Call this function with a real FCM token from frontend
const userFCMToken = "YOUR_REAL_FCM_TOKEN_HERE";
sendPushNotification(userFCMToken);
