const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 예시 라우터
app.get('/', (req, res) => {
    res.send('Hello Trash Sort Backend!');
});

module.exports = app;
