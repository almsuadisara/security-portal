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

// WebSocket: يجب أن يتم ربطه بالسيرفر
const server = require('http').Server(app); // أنشئ سيرفر HTTP
const wss = new WebSocket.Server({ server }); // ربط WebSocket بالسيرفر

// WebSocket: عندما يتصل عميل جديد
wss.on('connection', ws => {
    console.log('A new client connected');
  
    // استقبال رسالة من العميل (مثل طلبات أو إشعارات من العميل)
    ws.on('message', message => {
      console.log('Received message:', message);
    });
  
    // إرسال إشعار بانتهاء الجلسة
    function sendSessionExpiredNotification() {
      ws.send('Your session has expired. Please log in again.');
    }
  
    // يمكنك التحقق من انتهاء صلاحية التوكن هنا وإرسال الإشعار عندما تنتهي الصلاحية
    // سيتم إرسال الإشعار مباشرة بعد الاتصال هنا فقط كاختبار
    sendSessionExpiredNotification(); // هذا للإشارة إلى أنه يجب إرسال إشعار بعد انتهاء التوكن
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

// ربط السيرفر مع WebSocket
server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
