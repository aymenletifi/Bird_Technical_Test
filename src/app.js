const express = require("express");
const app = express();
const bcrypt = require('bcrypt');
const uuid = require("uuid");


const saltRounds = 10;


let users = [];

let tokens = [];

let blogs = [];

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome! Please follow README.md");
});

/**
 * warmup task
 */
app.post("/warmup-task", (req, res) => {

    let arr = req.body;
    let result = 1;
    let finalResult;


    if (Array.isArray(arr) && arr.length > 0) {

        for (let i = 0; i < arr.length; i++) {
            result = result * arr[i];
        }
        if (result > 0) finalResult = 1;
        else if (result < 0) finalResult = -1;
        else finalResult = 0;
    } else finalResult = null;

    res.json(finalResult);
});

/**
 * main task
 */
app.post("/main-task/user", (req, res) => {

    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.password, salt);

    users.push({
        userId: req.body.userId,
        login: req.body.login,
        password: hash
    })

    //res.json({ todo: "TODO" });
    res.sendStatus(201);
});

app.post("/main-task/authenticate", (req, res) => {

    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    if (users.filter(user => user.login == req.body.login).length == 0) return res.sendStatus(404);

    let retrievedUser = users.filter(user => user.login == req.body.login)[0];

    console.log(bcrypt.compareSync(req.body.password, retrievedUser.password));
    if (!bcrypt.compareSync(req.body.password, retrievedUser.password)) return res.sendStatus(401);

    let userToken = uuid.v4();

    tokens.push({
        "token": userToken,
        "userId": retrievedUser.userId
    });

    return res.json({
        "token": userToken
    });
});

app.post("/main-task/logout", (req, res) => {

    if (!tokens.find(token => token.token == req.headers.authorization)) return res.sendStatus(401);

    tokens.splice(tokens.indexOf(req.headers.authorization), 1);
    return res.sendStatus(200);
});

app.post("/main-task/blog-posts", (req, res) => {

    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    if (!tokens.find(token => token.token == req.headers.authorization)) return res.sendStatus(401);

    let userId = tokens.find(token => token.token === req.headers.authorization).userId;

    blogs.push({
        userId: userId,
        postId: req.body.postId,
        title: req.body.title,
        content: req.body.content,
        visibility: req.body.visibility
    })

    res.sendStatus(201);

});

app.get("/main-task/blog-posts", (req, res) => {


    let token = tokens.find(token => token.token == req.headers.authorization)

    if (token) {
        return res.json(
            blogs.filter(blog => blog.visibility == 'public' || blog.visibility == 'authenticated' || blog.userId == token.userId)
        )
    }

    return res.json(
        blogs.filter(blog => blog.visibility === 'public')
    )
});

module.exports = app;