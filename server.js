const express = require('express')
const morgan = require('morgan')
const connectDB = require('./config/db')
const bodyParser = require('body-parser')
const cors = require('cors')
const WebSocket = require('ws');

// Config dotev
require('dotenv').config({
    path: './config/config.env'
})

const app = express();

const server = require('http').Server(app); 
const wss = new WebSocket.Server({ server }); // ربط WebSocket بالسيرفر

// let me know if new client connect 
wss.on('connection', ws => {
    console.log('A new client connected');

    ws.on('message', message => {
      console.log('Received message:', message);
    });
  
    function sendSessionExpiredNotification() {
      ws.send('Your session has expired. Please log in again.');
    }
  
    sendSessionExpiredNotification(); 
});


// cros ..
app.use(cors({
    origin: 'http://localhost:3000', // السماح فقط لهذا الأصل
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // السماح بالطرق الضرورية فقط
    credentials: true   
}));

// Connect to database
connectDB();

// body parser
app.use(bodyParser.json())

// Load routes
const authRouter = require('./routes/auth.route')
const userRouter = require('./routes/user.route')

// Dev Logging Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: process.env.CLIENT_URL
    }))
    app.use(morgan('dev'))
}

// Use Routes
app.use('/api', authRouter)
app.use('/api', userRouter)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        msg: "Page not found"
    })
})

const PORT = process.env.PORT || 5000

// connect server with websocket
server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
