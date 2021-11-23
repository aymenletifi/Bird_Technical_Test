const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
	res.send("Welcome! Please follow README.md");
});

/**
 * warmup task
 */
app.post("/warmup-task", (req, res) => {
	res.json({
		requestBody: req.body,
		todo: "return result of warmup task instead of request body",
	});
});

/**
 * main task
 */
app.post("/main-task/user", (req, res) => {
	res.json({ todo: "TODO" });
});

app.post("/main-task/authenticate", (req, res) => {
	res.json({ todo: "TODO" });
});

app.post("/main-task/logout", (req, res) => {
	res.json({ todo: "TODO" });
});

app.post("/main-task/blog-posts", (req, res) => {
	res.json({ todo: "TODO" });
});

app.get("/main-task/blog-posts", (req, res) => {
	res.json({ todo: "TODO" });
});

module.exports = app;
