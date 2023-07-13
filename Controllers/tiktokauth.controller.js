const axios = require("axios");
const CreateError = require("http-errors");
const cookieParser = require("cookie-parser");
const FormData = require("form-data");
require("dotenv").config();
const {
  uploadFile,
  getListFiles,
  downloadFile,
  uploadMultipleFiles,
  createStreamfromGCP,
} = require("../helpers/GoogleCloudStorage");
var toArrayBuffer = require("to-arraybuffer");
require("bufferjs");

const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SERVER_ENDPOINT_REDIRECT = process.env.SERVER_ENDPOINT_REDIRECT;
const APP_ID = process.env.APP_ID;

// /oauth
const tiktokauth = async (req, res, next) => {
  try {
    const csrfState = Math.random().toString(36).substring(2);
    // set the csrf state cookie
    res.cookie("csrfState", csrfState, {
      maxAge: 3600000,
      httpOnly: true,
      secure: true,
    });

    let url = `https://www.tiktok.com/v2/auth/authorize/`;

    url += `?client_key=${CLIENT_KEY}`;
    url += `&scope=user.info.basic,user.info.profile,user.info.stats,video.list,video.publish,video.upload`;
    url += `&response_type=code`;
    url += `&redirect_uri=${SERVER_ENDPOINT_REDIRECT}`;
    url += `&state=${csrfState}`;

    res.redirect(url);
  } catch (error) {
    next(error);
  }
};

// /redirect
const tiktokredirect = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    console.log(`code: ${code} and state: ${state}`);
    const csrfState = req.cookies.csrfState;
    if (csrfState !== state) {
      throw CreateError.Unauthorized("Invalid state");
    }

    let url_access_token = `https://open.tiktokapis.com/v2/oauth/token/`;

    // send url encoded data

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
    };
    // set headers content type strictly to application/x-www-form-urlencoded
    await axios.post(url_access_token, {
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: SERVER_ENDPOINT_REDIRECT,
    }, config).then((response) => {
      // send the response in Json format
      res.json(response.data);
      console.log(response.data);
    }). catch((error) => {
      console.log(error);
    });


  } catch (error) {
    console.log(error);
  }
};

const tiktokrefresh = (req, res, next) => {
  try {
    const { refresh_token } = req.query;
    let url_refresh_token = `https://open.tiktokapis.com/v2/oauth/token/`;
    const body = {
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    }
    const configdata = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
    };

    axios.post(
      url_refresh_token,
      body,
      configdata
    ).then((response) => {
      // send the response in Json format
      res.json(response.data);
      console.log(response.data);
    });
  } catch (error) {
    next(error);
  }
};

const tiktokrevoke = (req, res, next) => {
  try {
    const { access_token } = req.query;

    let url_revoke = "https://open.tiktokapis.com/v2/oauth/revoke/";

    const body = {
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      token: access_token,
    }
    const configdata = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
    };

    axios.post(
      url_revoke,
      body,
      configdata
    ).then((response) => {
      // send the response in Json format
      res.json(response.data);
      console.log(response.data);
    });
  } catch (error) {
    next(error);
  }
};

// const gettiktokuser = (req, res, next) => {
//   try {
//     const { open_id, access_token } = req.query;

//     let url_user = "https://open-api.tiktok.com/oauth/userinfo/";
//     url_user += "?open_id=" + open_id;
//     url_user += "&access_token=" + access_token;

//     axios.get(url_user).then((response) => {
//       // send the response in Json format
//       res.json(response.data);
//       console.log(response.data);
//     });
//   } catch (error) {
//     next(error);
//   }
// };

//https://storage.googleapis.com/project_aarya_bucket/spiderman.mp4

// const uploadtiktokvideo = async (req, res, next) => {
//   try {
//     const videofile = await req.file;
//     const { open_id, access_token } = req.query;
//     let tiktokurl = "https://open-api.tiktok.com/share/video/upload/";
//     tiktokurl += "?open_id=" + open_id;
//     tiktokurl += "&access_token=" + access_token;
//     if (!videofile) {
//       const error = new Error("Please upload a file");
//       error.httpStatusCode = 400;
//       return next(error);
//     }
//     await uploadFile(videofile).then((response) => {
//         const videoname = response.filename;
//         const videobuffer = createStreamfromGCP(videoname);
//         const tiktokdata = new FormData();
//         tiktokdata.append("video", videobuffer, videoname);
//         axios
//             .post(tiktokurl, tiktokdata, {
//                 headers: {
//                     "Content-Type": `multipart/form-data; boundary=${tiktokdata._boundary}`,
//                 },
//             })
//             .then((response) => {
//                 res.json(response.data);
//                 console.log(response.data);
//             });

//     });

//   } catch (err) {
//     next(err);
//   }
// };

// // const responseData = await axios.get(Imagefile, { responseType: 'arraybuffer' })
// //             const buffer = Buffer.from(responseData.data, "utf-8")
// //             postImage = toArrayBuffer(buffer)
// //             const headers = {
// //                 Authorization: `Bearer ${accessToken}`,
// //                 "cache-control": "no-cache",
// //                 "X-Restli-Protocol-Version": "2.0.0",
// //                 "x-li-format": "json",
// //                 "Content-Type": `image/png`,
// //             };
// //             console.log('headers: ', headers);
// //             // const response = await
// //             axios
// //                 .post(uploadurl, postImage, { headers: headers })

// // const videouploadtiktok = async(videourl, open_id, access_token) => {
// //     return new Promise(async(resolve, reject) => {
// //         try {
// //             let tiktokurl = 'https://open-api.tiktok.com/share/video/upload/';
// //             tiktokurl += '?open_id=' + open_id;
// //             tiktokurl += '&access_token=' + access_token;

// //         } catch (error) {
// //             reject(error);
// //         }
// //     });
// // };

// const tiktokvideouploadapi = async (req, res, next) => {
//   try {
//     const { open_id, access_token } = req.query;
//     const videourl = req.body.videourl;
//     const tiktokdata = await videouploadtiktok(videourl, open_id, access_token);
//     res.json(tiktokdata);
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports = {
  tiktokauth,
  tiktokredirect,
  tiktokrefresh,
  tiktokrevoke,
};
