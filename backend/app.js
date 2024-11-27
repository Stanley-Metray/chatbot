console.clear();

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createServer } = require('http');
const express = require('express');
const { Server } = require('socket.io');
const socketManager = require('./utilities/socketManager');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('../backend/configuration/db-configure').config();
const routerConfig = require('../backend/configuration/router-config');
const cronJobs = require('./utilities/cronJobs');
const connect = require('./connection/connect');

const app = express();
const server = createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3500", "https://mychat1.s3.amazonaws.com"],
        methods: ["GET", "POST", "PUT"],
        credentials: true,
    }
});

socketManager.chatSocket(io);
cronJobs.archiveDailyMessages();

// Middleware
app.use(cors({
    origin: ["http://localhost:3500", "https://mychat1.s3.amazonaws.com"],
    methods: ["GET", "POST", "PUT"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Static file serving
app.use('/js', express.static(path.join(__dirname, '../frontend/public/js')));
app.use('/css', express.static(path.join(__dirname, '../frontend/public/css')));
app.use('/css', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, '../node_modules/bootstrap/dist/js')));
app.use('/font', express.static(path.join(__dirname, '../node_modules/bootstrap-icons/font')));

// Router configuration
routerConfig.config(app);

(async () => {
    await connect();
    server.listen(3500, (err) => {
        if (err) return console.log(err);

        console.log("Server started on port 3500...");
    });
})();
