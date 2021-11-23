module.exports = {
	testEnvironment: "node",
	reporters: ["default", ["jest-summary-reporter", { failuresOnly: false }]],
};
