const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const userRoute = require("./Routes/users");
const authRoute = require("./Routes/auth");
const conversationRoute = require("./Routes/conversation");
const messageRoute = require("./Routes/messages");

dotenv.config();

const app = express();
const server = http.createServer(app); // Use the same server instance for both Express and Socket.io

// Setup Socket.io server
const io = require('socket.io')(server, {
  cors: {
    origin: 'https://chatappfrond.farado.store',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


// Socket.io logic
let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) && users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Add user when they connect
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users); // Emit updated user list to all clients
  });

  // Handle sending messages
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", { senderId, text });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    removeUser(socket.id);
    io.emit("getUsers", users); // Emit updated user list after disconnection
  });
});

// Middleware
app.use(cors({
  origin:process.env.FRONTEND_URL,
  credentials:true
}));
app.use(express.json()); // Parse incoming JSON requests
app.use(helmet()); // Set various HTTP headers for security
app.use(morgan("common")); // Log HTTP requests

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit the process if there's an error
  }
};

// Call the function to connect to the database
connectDB();

// Serve static images from the 'public/images' directory
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, req.body.name);
  },
});
const upload = multer({ storage });

// Handle file upload requests
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    return res.status(200).json("File uploaded successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json("File upload failed");
  }
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);

const PORT = process.env.PORT||8800
// Start the server on port 8800
server.listen(PORT, () => {
  console.log(`Backend server with Socket.io is running on port ${PORT}!`);
});
