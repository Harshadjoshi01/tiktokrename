const axios = require('axios');
const CreateError = require("http-errors");
const cookieParser = require('cookie-parser');
require("dotenv").config();


const CLIENT_KEY = process.env.CLIENT_KEY;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SERVER_ENDPOINT_REDIRECT = process.env.SERVER_ENDPOINT_REDIRECT;
const APP_ID = process.env.APP_ID;


// /oauth
const tiktokauth = async(req, res, next) => {
    try {
        const csrfState = Math.random().toString(36).substring(2);
        // set the csrf state cookie
        res.cookie('csrfState', csrfState, { maxAge: 900000, httpOnly: true });
        console.log(csrfState)
    
        let url = `https://www.tiktok.com/auth/authorize/`;
    
        url += `?client_key=${CLIENT_KEY}`;
        url += `&scope=user.info.basic,video.list,video.upload`;
        url += `&response_type=code`;
        url += `&redirect_uri=${SERVER_ENDPOINT_REDIRECT}`;
        url += `&state=${csrfState}`;
    
        res.redirect(url);
    } catch (error) {
        next(error);
    }
};




// /redirect
const tiktokredirect = (req, res, next) => {
    try {
        const { code, state } = req.query;
        const { csrfState } = req.cookies;
        console.log(csrfState, state)
    
        if (state !== csrfState) {
            res.status(422).send('Invalid state');
            return;
        }
    
        let url_access_token = `https://open-api.tiktok.com/oauth/access_token/`;
        url_access_token += `?client_key=${CLIENT_KEY}`;
        url_access_token += `&client_secret=${CLIENT_SECRET}`;
        url_access_token += `&code=${code}`;
        url_access_token += `&grant_type=authorization_code`;

        axios
            .post(url_access_token)
            .then((response) => {
                // send the response in Json format
                res.json(response.data);
                console.log(response.data);
            })
    } catch (error) {
        next(error);
    }

};

const tiktokrefresh = (req, res, next) => {
    try {
        const { refresh_token } = req.query;
        let url_refresh_token = `https://open-api.tiktok.com/oauth/refresh_token/`;
        url_refresh_token += `?client_key=${CLIENT_KEY}`;
        url_refresh_token += `&client_secret=${CLIENT_SECRET}`;
        url_refresh_token += `&refresh_token=${refresh_token}`;
        url_refresh_token += `&grant_type=refresh_token`;

        axios
            .post(url_refresh_token)
            .then((response) => {
                // send the response in Json format
                res.json(response.data);
                console.log(response.data);
            })
    } catch (error) {
        next(error);
    }

};

const tiktokrevoke = (req, res, next) => {
    try {
        const { open_id, access_token } = req.query;

        let url_revoke = 'https://open-api.tiktok.com/oauth/revoke/';
        url_revoke += '?open_id=' + open_id;
        url_revoke += '&access_token=' + access_token;

        axios
            .post(url_revoke)
            .then((response) => {
                // send the response in Json format
                res.json(response.data);
                console.log(response.data);
            })
    } catch (error) {
        next(error);
    }

};

const gettiktokuser = (req, res, next) => {
    try {
        const { open_id, access_token } = req.query;

        let url_user = 'https://open-api.tiktok.com/oauth/userinfo/';
        url_user += '?open_id=' + open_id;
        url_user += '&access_token=' + access_token;

        axios
            .get(url_user)
            .then((response) => {
                // send the response in Json format
                res.json(response.data);
                console.log(response.data);
            })
    } catch (error) {
        next(error);
    }
};

const uploadtiktokvideo = (req, res, next) => {
    try {
        console.log(req.body)
        console.log(req.files)
        console.log(req.query)
    } catch (error) {
        next(error);
    }
};

module.exports = {
    tiktokauth,
    tiktokredirect,
    tiktokrefresh,
    tiktokrevoke,
    gettiktokuser,
    uploadtiktokvideo
};