const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Router import
const cameraRouter = require('../routes/camera/camera');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Router
app.use('/camera', cameraRouter);

// 예시 라우터
app.get('/', (req, res) => {
    res.send('Hello Trash Sort Backend!');
});

module.exports = app;