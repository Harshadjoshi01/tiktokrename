const express = require('express');
const morgan = require('morgan');
const CreateError = require('http-errors');
const cookieParser = require('cookie-parser');
const Multer  = require('multer');
const multer = Multer({
    storage: Multer.memoryStorage()
  });
const cors = require('cors');
const {tiktokauth, tiktokredirect, tiktokrefresh, tiktokrevoke, gettiktokuser, uploadtiktokvideo} = require('./Controllers/tictok.controller');
// const {getCoins,coinsinwallet,coinsondashboard} = require('./Controllers/market.controller');
require('dotenv').config();
const app = express();

app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));
app.use(cors());

app.get('/oauth', tiktokauth);
app.get('/redirect', tiktokredirect);
app.get('/refresh', tiktokrefresh);
app.get('/revoke', tiktokrevoke);
app.get('/user', gettiktokuser);
app.post('/upload', multer.single('video'), uploadtiktokvideo);
// app.get('/coins', getCoins);
// app.get('/coinsinwallet', coinsinwallet);
// app.get('/coinsondashboard', coinsondashboard);

app.get('/', (req, res, next) => {
    try {
        res.send('Hello From Crypto Wallet');
    } catch (error) {
        next(error);
    }
});

app.use((req, res, next) => {
    next(CreateError.NotFound( 'This route does not exist' ));
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    });
});



const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});