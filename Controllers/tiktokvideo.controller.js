const axios = require("axios");
const CreateError = require("http-errors");
require("dotenv").config();
const FormData = require("form-data");

const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SERVER_ENDPOINT_REDIRECT = process.env.SERVER_ENDPOINT_REDIRECT;
const APP_ID = process.env.APP_ID;

const {
    uploadFile,
    getListFiles,
    downloadFile,
    uploadMultipleFiles,
    createStreamfromGCP,
  } = require("../helpers/GoogleCloudStorage");


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

module.exports = {
    uploadVideoChunk,
};
