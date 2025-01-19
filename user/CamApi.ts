import { Router } from 'express';
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const faceapi = require("face-api.js");
import { Canvas, Image, ImageData } from 'canvas';
import { loadImage } from 'canvas';
import sharp from "sharp";
import { TelegramBotService } from '../telegram/cam_notification';

const camRouter = Router();
const botService = new TelegramBotService('7911946633:AAGg6RoGaGhbMYO-cmbbJ8UC_6VdUOtfphI');
// ESP32-CAM Stream URL and Credentials
const espStreamUrl = 'http://192.168.0.7/stream';
const espAuth = {
  username: 'admin', // Replace with your ESP32-CAM credentials
  password: 'abc123567',
};
const uploadDir = path.resolve(__dirname, "../../uploads");
// Extend face-api.js to use Node.js specific APIs
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
// Multer for handling image uploads
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Uploads folder created:", uploadDir);
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // Set limit to 10MB
});
camRouter.use(express.static("uploads")); // Serve uploaded images

// Load models
const loadModels = async () => {
  const modelPath = path.join(__dirname, "models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  console.log("Models loaded successfully");
};

// Initialize models when the application starts
loadModels().then(() => {
  console.log('Face recognition models are ready');
}).catch(err => {
  console.error('Error loading models:', err);
});

camRouter.post("/register", upload.single("image"), async (req: any, res) => {
  try {
    console.log("Upload directory:", req.file.path);

    const imagePath = req.file.path;
    const image = await loadImage(imagePath);

    // Detect a single face and extract descriptor
    const detection = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const resizedResults = faceapi.resizeResults(detection, { width: 320, height: 240 });


    // Check if a face was detected
    if (resizedResults.length === 0) {
      return res.status(400).json({ error: "No face detected" });
    }

    const faceData = {
      userId: req.body.userId,
      descriptor: Array.from(resizedResults.descriptor), // Convert Float32Array to plain array
    };

    const userFacesDir = `faces/${req.body.userId}`;
    // Create directory for the user if it doesn't exist
    if (!fs.existsSync(userFacesDir)) {
      fs.mkdirSync(userFacesDir, { recursive: true });
    }

    // Get the number of existing faces for this user
    const files = fs.readdirSync(userFacesDir);
    const nextFaceIndex = files.length + 1;

    // Save the face data with a unique name (e.g., userId_face1.json)
    fs.writeFileSync(`${userFacesDir}/face${nextFaceIndex}.json`, JSON.stringify(faceData));

    res.json({ message: "Face registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Face registration failed" });
  }
});

// Recognize a face
// Recognize route for face recognition (compare with all faces of the user)
camRouter.post("/recognize", upload.single("image"), async (req: any, res) => {
  try {
    const imagePath = req.file.path;
    const image = await loadImage(imagePath);

    // Detect a single face and extract descriptor
    const detection = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const resizedResults = faceapi.resizeResults(detection, { width: 320, height: 240 });


    // Check if a face was detected
    if (resizedResults.length === 0) {
      return res.status(400).json({ error: "No face detected" });

    }


    const descriptor = resizedResults.descriptor;
    const userId = req.body.userId; // The userId should be passed in the request body

    // Read all face files for the user
    const userFacesDir = `faces/${userId}`;
    if (!fs.existsSync(userFacesDir)) {
      return res.status(400).json({ error: "User not found" });
    }

    const registeredFaces = fs.readdirSync(userFacesDir).map((file: string) =>
      JSON.parse(fs.readFileSync(path.join(userFacesDir, file), 'utf-8'))
    );

    let bestMatch = null;
    let smallestDistance = Infinity;

    // Compare descriptors for each registered face
    registeredFaces.forEach((face: { descriptor: any; userId: any; }) => {
      const distance = faceapi.euclideanDistance(descriptor, face.descriptor);
      if (distance < smallestDistance && distance < 0.7) { // 0.6 is a typical threshold
        smallestDistance = distance;
        bestMatch = face.userId;
      }
    });

    if (bestMatch) {
      res.json({ userId: bestMatch });
    } else {
      res.status(400).json({ error: "No match found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Face recognition failed" });
  }
});

camRouter.post('/recognize/espcam', upload.single("image"), async (req: any, res: any) => {
  try {

    console.log('Received Esp32 Image');

    const imagePath = req.file.path;


    const image = await loadImage(imagePath);
    // Detect faces
    const detection = await faceapi
      .detectSingleFace(image)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.log("Image not detect");
      return res.status(400).json({ error: "Image not detect" });
    }

    const resizedResults = faceapi.resizeResults(detection, { width: 320, height: 240 });
    if (resizedResults.length === 0) {
      console.log("No faces detected");
      return res.status(400).json({ error: "No faces detected" });
    }
    const descriptor = resizedResults.descriptor;
    const facesDir = 'faces'; // Directory containing user folders
    const userFolders = fs.readdirSync(facesDir).filter((file: string) => fs.statSync(path.join(facesDir, file)).isDirectory()); // Get all directories in 'faces'

    let bestMatch = null;
    let smallestDistance = Infinity;
    let matchedFolder = ""; // To store the name of the matched folder

    // Iterate over each folder (user) in the 'faces' directory
    for (const userFolder of userFolders) {
      const userFacesDir = path.join(facesDir, userFolder);

      if (!fs.existsSync(userFacesDir)) {
        return res.status(400).json({ error: `User folder '${userFolder}' not found` });
      }

      const registeredFaces = fs.readdirSync(userFacesDir).map((file: string) =>
        JSON.parse(fs.readFileSync(path.join(userFacesDir, file), 'utf-8'))
      );

      // Compare descriptors for each registered face in the folder
      registeredFaces.forEach((face: { descriptor: any; userId: any; }) => {
        const distance = faceapi.euclideanDistance(descriptor, face.descriptor);
        if (distance < smallestDistance && distance < 0.7) { // 0.6 is a typical threshold
          smallestDistance = distance;
          bestMatch = face.userId;
          matchedFolder = userFolder; // Store the folder name of the matched user
        }
      });
    }

    const filePath = path.join(__dirname, 'uploads/recognized', `image_${Date.now()}.jpg`);
    const filePathStranger = path.join(__dirname, 'uploads/stranger', `image_${Date.now()}.jpg`);

    const uploadDir = path.dirname(filePath);
    const uploadDirStranger = path.dirname(filePathStranger);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // create all directories in the path if needed
    }
    if (!fs.existsSync(uploadDirStranger)) {
      fs.mkdirSync(uploadDirStranger, { recursive: true }); // create all directories in the path if needed
    }

    // Check if a match was found
    if (bestMatch) {
      // Move the file to the 'recognized' folder
      fs.renameSync(imagePath, filePath);

      // Send the image to Telegram bot with the correct file path string
      botService.sendMessageWithImage('1293926065', `${matchedFolder} detected!`, filePath);
      console.log(`${matchedFolder} matched`);
    } else {
      // Move the file to the 'stranger' folder
      fs.renameSync(imagePath, filePathStranger);

      // Send the image to Telegram bot with the correct file path string
      botService.sendMessageWithImage('1293926065', 'Stranger detected!', filePathStranger);
      console.log("No face matched");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Face recognition failed' });
  }
});

export default camRouter;


