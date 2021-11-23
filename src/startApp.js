const app = require("./app");

const port = 3001;

app.listen(port, () => {
	console.log(`Express server listening at http://localhost:${port}`);
});
