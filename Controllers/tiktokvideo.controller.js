const axios = require("axios");
require("dotenv").config();


const registerVideoChunk = async (videoByteSize, accessToken) => {
    return new Promise(async (resolve, reject) => {
        let videoChunkSize = 0;
        let videoChunkCount = 0;
        if (videoByteSize <= 10000000){
            videoChunkSize = videoByteSize;
            videoChunkCount = 1;
        } else {
            videoChunkSize = 10000000;
            videoChunkCount = Math.floor(videoByteSize / videoChunkSize);
        }

        try {
            // console.log(videoByteSize, videoChunkSize, videoChunkCount)
            const url = `https://open.tiktokapis.com/v2/post/publish/inbox/video/init/`;
            const data = {
                "source_info": {
                    "source": "FILE_UPLOAD",
                    "video_size": videoByteSize,
                    "chunk_size" : videoChunkSize,
                    "total_chunk_count": videoChunkCount
                }
            };
            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await axios.post(url, data, config);
            resolve({
                status: "success",
                videoChunkCount: videoChunkCount,
                data: response.data,
                videoChunkSize: videoChunkSize,
            });
        } catch (error) {
            reject(error);
        }
    });

};

const uploadVideoChunk = async (req, res, next) => {
    try {
        const file = req.file;
        const accessToken = req.query.accessToken;
        const videoByteSize = file.size;
        // const uploadedvideo = await uploadFile(file);
        // const videoname = uploadedvideo.filename;
        const videoBuffer = file.buffer;
        const resregisterVideoChunk = await registerVideoChunk(videoByteSize, accessToken);
        // console.log(resregisterVideoChunk)
        const tiktokUploadUrl = resregisterVideoChunk.data.data.upload_url;
        // console.log(tiktokUploadUrl)
        const videoId = resregisterVideoChunk.data.data.publish_id;
        const videoChunkSize = resregisterVideoChunk.videoChunkSize;
        const videoChunkCount = resregisterVideoChunk.videoChunkCount;
        let i = 0;
        while(i < videoChunkCount - 1){
            const start = i * videoChunkSize;
            const end = start + videoChunkSize - 1;
            console.log(`start > ${start} end > ${end} videoChunkSize > ${videoChunkSize} videoByteSize > ${videoByteSize}`)
            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": `${file.mimetype}`,
                    "Content-Length": `${videoChunkSize}`,
                    "Content-Range": `bytes ${start}-${end}/${videoByteSize}`,
                },
            };
            await axios.put(tiktokUploadUrl, videoBuffer, config);
            i++;
        }
        // last chunk upload
        const last_chunk_size = videoByteSize - (videoChunkSize * (videoChunkCount - 1));
        const last_start = videoChunkSize * (videoChunkCount - 1);
        const last_end = last_start + last_chunk_size - 1;
        console.log(`last_start > ${last_start} last_end > ${last_end} last_chunk_size > ${last_chunk_size} videoByteSize > ${videoByteSize}`)
        const last_config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": `${file.mimetype}`,
                "Content-Length": `${last_chunk_size}`,
                "Content-Range": `bytes ${last_start}-${last_end}/${videoByteSize}`,
            },
        };
        const resuploadVideoChunk = await axios.put(tiktokUploadUrl, videoBuffer, last_config);
        console.log(resuploadVideoChunk);
        res.status(200).json({
            status: "success",
            data: resuploadVideoChunk.data,
            videoid: videoId,
        });

    } catch (error) {
        console.log(error);
    }
};


const Creatorquery = async (accessToken) => {
    return new Promise((resolve, reject) => {
    try {
        const url = `https://open.tiktokapis.com/v2/post/publish/creator_info/query/`
        const config = {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json; charset=utf-8",
            },
        };
        axios.post(url,{}, config).then((response) => {
            resolve(response.data);
        }).catch((error) => {
            reject(error);
        });
    } catch (error) {
        reject(error);
    }
    });
};


const IntializeUpload = async (accessToken, videofile, title, privacy_level) => {
    return new Promise(async (resolve, reject) => {
    try {
        const header = Buffer.from("mvhd");
        const video_supported_formats = ['video/mp4', 'video/quicktime', 'video/webm']
        const video_mimetype = videofile.mimetype;
        const video_mimetype_supported = video_supported_formats.find((item) => item === video_mimetype);
        const buffer = videofile.buffer;
        const start = buffer.indexOf(header) + 17;
        const timeScale = buffer.readUInt32BE(start);
        const duration = buffer.readUInt32BE(start + 4);
        const audioLength = Math.floor((duration / timeScale) * 1000) / 1000;
        const audioLengthInSec = Math.floor(audioLength);
        console.log("Video Duration in Seconds > ", audioLengthInSec);
        const creatorqueryres = await Creatorquery(accessToken);
        console.log("creatorqueryres > ", creatorqueryres);
        const maxVideoDuration = creatorqueryres.data.max_video_duration_in_seconds;
        const privacy_level_options = creatorqueryres.data.privacy_level_options;
        const privacy_level_option = privacy_level_options.find((item) => item === privacy_level);
        if(!privacy_level_option){
            reject({
                status: "error",
                message: `Please provide valid privacy_level. Your privacy_level should be one of ${privacy_level_options.map((item) => item).join(", ")}`,
            });
        } else if(!video_mimetype_supported){
            reject({
                status: "error",
                message: `Please provide valid video file. Your video file should be one of MP4, MOV, WEBM`,
            });
        } else if(audioLengthInSec > maxVideoDuration){
            reject({
                status: "error",
                message: `Please upload video less than ${maxVideoDuration} seconds. For more information please visit https://developers.tiktok.com/doc/content-sharing-guidelines#required_ux_implementation_in_your_app`,
            });
        } else {
            const url = `https://open.tiktokapis.com/v2/post/publish/video/init/`;
            const videoByteSize = videofile.size;
            let videoChunkSize = 0;
            let videoChunkCount = 0;
            if (videoByteSize <= 10000000){
                videoChunkSize = videoByteSize;
                videoChunkCount = 1;
            } else {
                videoChunkSize = 10000000;
                videoChunkCount = Math.floor(videoByteSize / videoChunkSize);
            }
            const data = {
                "post_info": {
                    "title": title,
                    "privacy_level": privacy_level,
                    "disable_duet": false,
                    "disable_comment": false,
                    "disable_stitch": false,
                    "video_cover_timestamp_ms": 1000
                  },
                  "source_info": {
                      "source": "FILE_UPLOAD",
                      "video_size": videoByteSize,
                      "chunk_size":  videoChunkSize,
                      "total_chunk_count": videoChunkCount
                  }
            };
            const config = {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json; charset=utf-8",
                },
            };
            await axios.post(url,data,config).then((response) => {
                resolve({
                    status: "success",
                    data: response.data,
                    videoByteSize: videoByteSize,
                    videoChunkSize: videoChunkSize,
                    videoChunkCount: videoChunkCount,
                });
            }).catch((error) => {
                reject({
                    status: "error",
                    message: error.response.data.error,
                });
            });
        }        

    } catch (error) {
        reject({
            status: "error",
            message: error.response.data.error,
        });
    }
    });
};


const UploadVideo = async (accessToken, videofile, title, privacy_level) => {
    return new Promise(async (resolve, reject) => {
    try {
        const resregisterVideoChunk = await IntializeUpload(accessToken, videofile, title, privacy_level);
        console.log("resregisterVideoChunk > ", resregisterVideoChunk);
        const tiktokUploadUrl = resregisterVideoChunk.data.data.upload_url;
        const videoId = resregisterVideoChunk.data.data.publish_id;
        const videoChunkSize = resregisterVideoChunk.videoChunkSize;
        const videoChunkCount = resregisterVideoChunk.videoChunkCount;
        const videoByteSize = resregisterVideoChunk.videoByteSize;
        const file = videofile;
        const videoBuffer = file.buffer;
        let i = 0;
        while(i < videoChunkCount - 1){
            const start = i * videoChunkSize;
            const end = start + videoChunkSize - 1;
            console.log(`start > ${start} end > ${end} videoChunkSize > ${videoChunkSize} videoByteSize > ${videoByteSize}`)
            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": `${file.mimetype}`,
                    "Content-Length": `${videoChunkSize}`,
                    "Content-Range": `bytes ${start}-${end}/${videoByteSize}`,
                },
            };
            await axios.put(tiktokUploadUrl, videoBuffer, config);
            i++;
        }
        // last chunk upload
        const last_chunk_size = videoByteSize - (videoChunkSize * (videoChunkCount - 1));
        const last_start = videoChunkSize * (videoChunkCount - 1);
        const last_end = last_start + last_chunk_size - 1;
        console.log(`last_start > ${last_start} last_end > ${last_end} last_chunk_size > ${last_chunk_size} videoByteSize > ${videoByteSize}`)
        const last_config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": `${file.mimetype}`,
                "Content-Length": `${last_chunk_size}`,
                "Content-Range": `bytes ${last_start}-${last_end}/${videoByteSize}`,
            },
        };
        const resuploadVideoChunk = await axios.put(tiktokUploadUrl, videoBuffer, last_config);
        console.log(resuploadVideoChunk);
        resolve({
            status: "success",
            data: resuploadVideoChunk.data,
            videoid: videoId,
        });

    } catch (error) {
        reject({
            status: "error",
            message: error,
        });
    }
    });
};



const CheckVideoStatus = async (accessToken, videoid) => {
    return new Promise(async (resolve, reject) => {
    try {
        const url = `https://open.tiktokapis.com/v2/post/publish/status/fetch/`;
        const config = {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json; charset=utf-8",
            },
        };
        const data = {
            "publish_id": videoid 
        }
        await axios.post(url,data, config).then((response) => {
            resolve({
                status: "success",
                data: response.data,
            });
        }).catch((error) => {
            reject({
                status: "error",
                message: error.response.data.error,
            });
        });
    } catch (error) {
        reject({
            status: "error",
            message: error.response.data.error,
        });
    }
    });
};

const PostVideoOnTiktok = async (req, res, next) => {
    try {
        const accessToken = req.query.accessToken;
        const videofile = req.file;
        const title = req.body.title;
        const privacy_level = req.body.privacy_level;
        const resUploadVideo = await UploadVideo(accessToken, videofile, title, privacy_level);
        const videoStatus = await CheckVideoStatus(accessToken, resUploadVideo.videoid);
        res.status(200).json({
            status: "success",
            data: videoStatus.data,
        });
    } catch (error) {
        res.status(400).json(error);
    }
};

module.exports = {
    PostVideoOnTiktok,
};
