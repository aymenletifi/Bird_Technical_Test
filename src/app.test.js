const uuid = require("uuid");
const supertest = require("supertest");

const app = require("./app");

app.use(logErrors);

function logErrors(err, req, res, next) {
    console.error(err.stack);
    next(err);
}

const request = supertest(app);

describe("warmup task", () => {
    describe("POST /warmup-task", () => {
        test("returns 1 for input [1, -2, -3, 5]", async() => {
            expect.assertions(1);

            const requestBody = [1, -2, -3, 5];
            const response = await request
                .post("/warmup-task")
                .send(requestBody);

            expect(response.body).toBe(1);
        });

        test("returns -1 for input [1, 2, 3, -5]", async() => {
            expect.assertions(1);

            const requestBody = [1, 2, 3, -5];
            const response = await request
                .post("/warmup-task")
                .send(requestBody);

            expect(response.body).toBe(-1);
        });

        test("returns 0 for input [1, 2, 0, -5]", async() => {
            expect.assertions(1);

            const requestBody = [1, 2, 0, -5];
            const response = await request
                .post("/warmup-task")
                .send(requestBody);

            expect(response.body).toBe(0);
        });

        test("returns null for input []", async() => {
            expect.assertions(1);

            const requestBody = [];
            const response = await request
                .post("/warmup-task")
                .send(requestBody);

            expect(response.body).toBe(null);
        });
    });
});

describe("main task", () => {
    const validateUUID = uuid.validate;
    const generateUUID = uuid.v4;

    /**
     * fixtures re-used throughout tests
     */
    const user1 = Object.freeze({
        userId: generateUUID(),
        login: "user1",
        password: "password",
    });

    const user2 = Object.freeze({
        userId: generateUUID(),
        login: "user2",
        password: "anotherPassword",
    });

    const blogPostsCreatedByUser1 = Object.freeze([{
            postId: generateUUID(),
            title: "tit1",
            content: "c1",
            visibility: "public",
        },
        {
            postId: generateUUID(),
            title: "tit2",
            content: "c2",
            visibility: "private",
        },
        {
            postId: generateUUID(),
            title: "tit3",
            content: "c3",
            visibility: "authenticated",
        },
    ]);

    // set during test execution
    let sessionToken1User1;
    let sessionToken2User1;
    let sessionToken1User2;

    // reset tokens after test execution
    afterAll(async() => {
        sessionToken1User1 = null;
        sessionToken2User1 = null;
        sessionToken1User2 = null;

        // avoid jest open handle error https://github.com/visionmedia/supertest/issues/520
        await new Promise((resolve) => setTimeout(() => resolve(), 500));
    });

    /**
     * USER CREATION
     */
    describe("POST /main-task/user", () => {
        test("returns 201 when given correct input", async() => {
            expect.assertions(2);

            const response1 = await request.post("/main-task/user").send(user1);
            expect(response1.status).toBe(201);

            const response2 = await request.post("/main-task/user").send(user2);
            expect(response2.status).toBe(201);
        });

        test("returns 400 when called without body content", async() => {
            expect.assertions(1);
            const response = await request.post("/main-task/user").send({});
            expect(response.status).toBe(400);
        });
    });

    /**
     * USER LOGIN
     */
    describe("POST /main-task/authenticate", () => {
        test("returns 400 when called without body content", async() => {
            expect.assertions(1);
            const response = await request
                .post("/main-task/authenticate")
                .send({});
            expect(response.status).toBe(400);
        });

        test("returns 404 when user does not exist", async() => {
            expect.assertions(1);
            const requestBody = {
                login: "user3",
                password: "lalala",
            };
            const response = await request
                .post("/main-task/authenticate")
                .send(requestBody);
            expect(response.status).toBe(404);
        });

        test("returns 401 when the password is wrong", async() => {
            expect.assertions(1);
            const requestBody = {
                ...user1,
                password: "wrongPassword",
            };
            const response = await request
                .post("/main-task/authenticate")
                .send(requestBody);
            expect(response.status).toBe(401);
        });

        test("returns 200 and UUID token when given valid user data", async() => {
            expect.assertions(6);

            const response1 = await request
                .post("/main-task/authenticate")
                .send(user1);
            expect(response1.status).toBe(200);
            sessionToken1User1 = response1.body.token;
            expect(sessionToken1User1).toBeTruthy();
            expect(validateUUID(sessionToken1User1)).toBe(true);

            const response2 = await request
                .post("/main-task/authenticate")
                .send(user2);
            expect(response2.status).toBe(200);
            sessionToken1User2 = response2.body.token;
            expect(sessionToken1User2).toBeTruthy();
            expect(validateUUID(sessionToken1User2)).toBe(true);
        });

        test("returns 200 and another token when a user logs in for a second time", async() => {
            expect.assertions(4);
            const response = await request
                .post("/main-task/authenticate")
                .send(user1);
            expect(response.status).toBe(200);
            sessionToken2User1 = response.body.token;
            expect(sessionToken2User1).toBeTruthy();
            expect(validateUUID(sessionToken2User1)).toBe(true);
            expect(sessionToken2User1).not.toBe(sessionToken1User1);
        });
    });

    /**
     * USER LOGOUT
     */
    describe("POST /main-task/logout", () => {
        test("returns 401 when given an invalid token", async() => {
            expect.assertions(1);
            const response = await request
                .post("/main-task/logout")
                .set("Authorization", generateUUID());
            expect(response.status).toBe(401);
        });

        test("returns 200 when given a valid token, and invalidates just the passed token of the user", async() => {
            expect.assertions(2);

            const response = await request
                .post("/main-task/logout")
                .set("Authorization", sessionToken2User1);
            expect(response.status).toBe(200);

            const blogPostCreationResponse = await request
                .post("/main-task/blog-posts")
                .send(blogPostsCreatedByUser1[0])
                .set("Authorization", sessionToken1User1);
            expect(blogPostCreationResponse.status).toBe(201);
        });

        test("returns 401 when given a token which has already been used to log out", async() => {
            expect.assertions(1);
            const response = await request
                .post("/main-task/logout")
                .set("Authorization", sessionToken2User1);
            expect(response.status).toBe(401);
        });
    });

    /**
     * ARTICLE CREATION
     */
    describe("POST /main-task/blog-posts", () => {
        test("returns 400 when called without body content", async() => {
            expect.assertions(1);
            const response = await request
                .post("/main-task/blog-posts")
                .send({})
                .set("Authorization", sessionToken1User1);
            expect(response.status).toBe(400);
        });

        test("returns 401 when given an invalid token", async() => {
            expect.assertions(1);
            const response = await request
                .post("/main-task/blog-posts")
                .send(blogPostsCreatedByUser1[0])
                .set("Authorization", generateUUID());
            expect(response.status).toBe(401);
        });

        test("returns 201 when given valid inputs", async() => {
            expect.assertions(blogPostsCreatedByUser1.length);
            for (const blogPost of blogPostsCreatedByUser1) {
                const response = await request
                    .post("/main-task/blog-posts")
                    .send(blogPost)
                    .set("Authorization", sessionToken1User1);
                expect(response.status).toBe(201);
            }
        });
    });

    /**
     * ARTICLE LISTING
     */
    describe("GET /main-task/blog-posts", () => {
        test("returns 200 and all blog posts created by an authenticated user", async() => {
            expect.assertions(2 + blogPostsCreatedByUser1.length);
            const response = await request
                .get("/main-task/blog-posts")
                .set("Authorization", sessionToken1User1);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            const returnedBlogPostIdsUser1 = response.body.map(
                (blogPost) => blogPost.postId
            );
            blogPostsCreatedByUser1.forEach((blogPost) =>
                expect(returnedBlogPostIdsUser1.includes(blogPost.postId)).toBe(
                    true
                )
            );
        });

        test("returns 200 and blog posts with visibility public and authenticated to an authenticated user", async() => {
            const expectedBlogPostsUser2 = blogPostsCreatedByUser1.filter(
                (blogPost) =>
                blogPost.visibility === "public" ||
                blogPost.visibility === "authenticated"
            );
            expect.assertions(3 + expectedBlogPostsUser2.length);
            const response = await request
                .get("/main-task/blog-posts")
                .set("Authorization", sessionToken1User2);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(expectedBlogPostsUser2.length);
            const returnedBlogPostIdsUser2 = response.body.map(
                (blogPost) => blogPost.postId
            );
            expectedBlogPostsUser2.forEach((blogPost) =>
                expect(returnedBlogPostIdsUser2.includes(blogPost.postId)).toBe(
                    true
                )
            );
        });

        test("returns 200 and public blog posts to unauthenticated users", async() => {
            const expectedBlogPostsUnauthenticatedUser =
                blogPostsCreatedByUser1.filter(
                    (blogPost) => blogPost.visibility === "public"
                );
            expect.assertions(3 + expectedBlogPostsUnauthenticatedUser.length);
            const response = await request.get("/main-task/blog-posts");
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            console.log(response.body)
            expect(response.body.length).toBe(
                expectedBlogPostsUnauthenticatedUser.length
            );
            const returnedBlogPostIds = response.body.map(
                (blogPost) => blogPost.postId
            );
            expectedBlogPostsUnauthenticatedUser.forEach((blogPost) =>
                expect(returnedBlogPostIds.includes(blogPost.postId)).toBe(true)
            );
        });
    });
});