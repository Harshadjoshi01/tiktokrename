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
        console.log(response.data.data.user);
        res.send(response.data.data.user);
    } catch (error) {
        next(error);
    }
};


const gettiktokvideolist = (token,cursor) => {
        return new Promise((resolve, reject) => {
            try {
                if(cursor == undefined){
                    let url = `https://open.tiktokapis.com/v2/video/list/`;        
                    axios.post(url,{
                        max_count: 20,
                    },{
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        params: {
                            fields:`id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
                        },
                    }).then((response) => {
                        console.log(`cursor: ${cursor}`)
                        console.log(response.data)
                        resolve(response.data);
                    }) .catch((error) => {
                        console.log(error);
                    });
                } else {
                    let url = `https://open.tiktokapis.com/v2/video/list/`;        
                    axios.post(url,{
                        max_count: 20,
                        cursor: cursor,
                    },{
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        params: {
                            fields:`id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
                        },
                    }).then((response) => {
                        console.log(response.data)
                        resolve(response.data);
                    }) .catch((error) => {
                        console.log(error);
                    });
                }
            } catch (error) {
                console.log(error);
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
        let cursor = response.data.cursor;
        await videos.forEach((video) => {
            usertiktokvideos.push(video);
        });
        while(has_more){
            response = await gettiktokvideolist(access_token,cursor);
            videos = response.data.videos;
            has_more = response.data.has_more;
            cursor = response.data.cursor;
            await videos.forEach((video) => {
                usertiktokvideos.push(video);
            });
        }
        res.send(usertiktokvideos);
    } catch (error) {
        next(error);
    }
};
        

const queryvideo = (token,videoidsarray) => {
    return new Promise((resolve, reject) => {
        try {
            let url = `https://open.tiktokapis.com/v2/video/query/`;        
            axios.post(url,{
                filters: {
                    "video_ids": videoidsarray,
                }},{
                headers: {
                    "Authorization": `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                // write query parameters here
                params: {
                    fields:`id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`,
               },
                }).then((response) => {
                    console.log(response.data)
                    resolve(response.data);
                }) .catch((error) => {
                    console.log(error);
                });
        } catch (error) {
            console.log(error);
        }
    });
};

const gettiktokvideobyid = async (req, res, next) => {
    try {
        const { access_token} = req.query;
        const { videos} = req.body;
        const video_len = videos.length;
        if (video_len < 20){
            const counter = Math.ceil(video_len/20);
            const usertiktokvideos = [];
            for (let i = 0; i < counter; i++) {
                let response = await queryvideo(access_token,videos.slice(i*20,(i+1)*20));
                let resvideos = response.data.videos;
                await resvideos.forEach((video) => {
                    usertiktokvideos.push(video);
                });
            }
            res.send(usertiktokvideos);
            return;
        } else if (video_len == 0){
            res.send("No videos provided");
            return;
        } else {
            const response = await queryvideo(access_token,videos);
            res.send(response.data.videos);
            return;
        }

    } catch (error) {
        next(error);
    }
};

module.exports = {
    gettiktokuserinfo,
    getallvideos,
    gettiktokvideobyid,
};