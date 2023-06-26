const axios = require("axios");


const gettiktokuserinfo = async (req, res, next) => {
    try {
        const { access_token } = req.query;
        let url = `https://open.tiktokapis.com/v2/user/info/`;        
        const response = await axios.get(url,{
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            // write query parameters here
            params: {
                fields:`open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count`,
            }
        });
        console.log(response.data);
        res.send(response.data);
    } catch (error) {
        next(error);
    }
};


const gettiktokvideolist = async (token,cursor) => {
        return new Promise(async (resolve, reject) => {
            try {
                if(cursor == undefined || cursor == null || cursor == "" || cursor == "0"){
                    let url = `https://open.tiktokapis.com/v2/user/video/list/`;        
                    const response = await axios.post(url,{
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        params: {
                            fields:`id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
                        },
                        data: {
                            max_count: 20,
                        },
                    });
                    resolve(response.data);
                } else {
                    let url = `https://open.tiktokapis.com/v2/user/video/list/`;        
                    const response = await axios.post(url,{
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        params: {
                            fields:`id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
                        },
                        data: {
                            max_count: 20,
                            cursor: cursor,
                        },
                    });
                    resolve(response.data);
                }
            } catch (error) {
                reject(error);
            }
        });
};

const getallvideos = async (req, res, next) => {
    try {
        const { access_token } = req.query;
        const usertiktokvideos = [];
        let response = await gettiktokvideolist(access_token);
        let videos = response.data.videos;
        let has_more = response.data.has_more;
        while (has_more) {
            videos.forEach((video) => {
                usertiktokvideos.push(video);
            });
            response = await gettiktokvideolist(access_token);
            videos = response.data.videos;
            has_more = response.data.has_more;
        }
        res.send(usertiktokvideos);
    } catch (error) {
        next(error);
    }
};
        

const gettiktokvideobyid = async (req, res, next) => {
    try {
        const { access_token} = req.query;
        const { videos} = req.body;
        let url = `https://open.tiktokapis.com/v2/video/item/`;        
        const response = await axios.post(url,{
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            // write query parameters here
            params: {
                fields:`id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
           },
            // write body parameters here
            data: {
                filters: {
                    "video_ids": videos,
                }
            }
        });
        console.log(response.data);
        res.send(response.data);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    gettiktokuserinfo,
    getallvideos,
    gettiktokvideobyid,
};