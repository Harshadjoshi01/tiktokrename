const express = require("express");
const morgan = require("morgan");
const CreateError = require("http-errors");
const cookieParser = require("cookie-parser");
const Multer = require("multer");
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: { fileSize: 128 * 1024 * 1024 },
});
const cors = require("cors");
const {
  tiktokauth,
  tiktokredirect,
  tiktokrefresh,
  tiktokrevoke,
} = require("./Controllers/tiktokauth.controller");
const {gettiktokuserinfo,getallvideos,gettiktokvideobyid} = require("./Controllers/tiktokdisplay.controller");
const {PostVideoOnTiktok, GetVideoStatus} = require("./Controllers/tiktokvideo.controller");
require("dotenv").config();
const app = express();

app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use(cors(
  {
    origin: true,
    credentials: true,
  }
));


app.get("/oauth", tiktokauth);
app.get("/redirect", tiktokredirect);
app.get("/refresh", tiktokrefresh);
app.get("/revoke", tiktokrevoke);
app.get("/user", gettiktokuserinfo);
app.get("/videos", getallvideos);
app.get("/video", gettiktokvideobyid);
// app.get("/creator", Creatorquery);
app.post("/upload", multer.single("video"), PostVideoOnTiktok);
// app.get("/videostatus", GetVideoStatus);

// app.get('/coins', getCoins);
// app.get('/coinsinwallet', coinsinwallet);
// app.get('/coinsondashboard', coinsondashboard);

app.get("/", (req, res, next) => {
  try {
    res.send("Hello From Crypto Wallet");
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  next(CreateError.NotFound("This route does not exist"));
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

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
