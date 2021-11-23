# Node Code Challenge

## General Guidelines

This code challenge consists of two tasks. There's a simple, quick warmup task, and a tougher main task.

Please start by creating a branch in which you implement your solutions. Afterwards, solve the tasks in the order you prefer.

Do not spend more than 2h of time in total, even if the solution is not complete. Focus on delivering the **simplest** code to solve the task.

When you're wrapping up, push your work, issue a pull request, and request review from [@franciscolourenco](https://github.com/franciscolourenco) or `@philipp-tailor`.

---

## Setup

```sh
# install dependencies
yarn # or npm install

# run express server; the server auto-restarts on change
yarn dev # or npm run dev

# run tests
yarn test # or npm run test
```

If you use the [insomnia](https://insomnia.rest/) request client, you can import `insomnia.json` to use the collection of prepared API calls.

---

## Warmup Task

Finish the endpoint `POST /warmup-task`. The endpoint expects a JSON array of integers as request body content.

The endpoint is supposed to return (as JSON) either `null, -1`, `0`, or `1`, depending on the sign of the product of all numbers in the array multiplied.

### Examples

#### Example 1

Given `[1, -2, -3, 5]`, the call should return `1` (the multiplication equals 30).

#### Example 2

Given `[1, 2, 3, -5]`, the call should return `-1` (the multiplication equals -30).

#### Example 3

Given `[1, 2, 0, -5]`, the call should return `0` (the multiplication equals 0).

#### Example 4

Given `[]`, the call should return `null`.

---

## Main Task: Token-based authentication

Implement a simple token-based authentication.

### Endpoints

The API should support the following requests:

#### `POST /main-task/user`

Add a user to the in memory database.

-   Request Body (JSON):
    -   `userId: string (UUID)`
    -   `login: string`
    -   `password: string`
-   Response:
    -   HTTP 400, if the body is empty.
    -   HTTP 201, if the user has been created. The response body can be empty.

#### `POST /main-task/authenticate`

Authenticate a user.

-   Request Body (JSON):
    -   `login: string`
    -   `password: string`
-   Response:

    -   HTTP 400, if the body is empty.
    -   HTTP 404, if there is no user of the given login name in the database.
    -   HTTP 401, if a user with the given login name exists, but the password does not match that saved in the database for the corresponding user.
    -   HTTP 200, if a user with the given login name exists and the given password matches that saved in the database. The response body should be in the shape of: `{"token": "<uuid>"}`.

#### `POST /main-task/logout`

Log out the user whose token is in the request's headers.

-   Response:

    -   HTTP 401, if the token is invalid.
    -   HTTP 200, if the user is logged out successfully. The token that was passed is invalidated.

#### `POST /main-task/blog-posts`

Create a blog post consisting of title, content and the level of its visibility. Only a user with a valid session can create blog posts.

-   Request Body (JSON):
    -   `postId: string`
    -   `title: string (UUID)`
    -   `content: string`
    -   `visibility: 'public' | 'private' | 'authenticated'`:
        -   `public` - the blog post is available publicly.
        -   `private` - the blog post is only accessible to the creator.
        -   `authenticated` - only users with valid session can access the blog post.
-   Response:
    -   HTTP 400, if the body is empty.
    -   HTTP 401, if the provided token is invalid.
    -   HTTP 201, if the blog post has been created. The response body can be empty.

#### `GET /main-task/blog-posts`

Return a list of blog posts. The result depends on the token.

-   Response: HTTP 200:
    -   If a valid token is given in the request headers return:
        -   All public blog posts,
        -   all blog posts with visibility: 'authenticated', and
        -   the sender's blog posts.
    -   Otherwise, return only public blog posts.
    -   A blog post object consists of the following fields: `postId`, `title`, `content` and `userId` which all are strings, and the `visibility` field which equals one of these values: `public` / `private` / `authenticated`.
    -   The blog posts can be returned in any order.

### Other acceptance criteria

-   Keep all content in memory. No database or storage back end is available.
-   The token should be passed as `Authorization` header to requests, whenever required.
-   A token is associated with a user. It is considered to be invalid if the token was used to log the user out, or if it has never been created as a result of logging the user in.
-   It is entirely possible that a user has multiple valid tokens. Sending two consecutive login requests can be completed successfully, and the token returned by the first request does not become invalid as a result of the second request.
-   The body of a response with status codes 4xx can be empty.
-   HTTP 5xx error codes are considered errors and must not be returned.

### Input guarantees

-   Users have a unique id and unique login - the server will never receive two `POST /main-task/user` requests with the same `id` or `login`.
-   Blog posts also have a unique `id`.
-   The `content-type` header is set to `application/json` in every `POST` request.
-   Strings (including `id`s) have 1 to 100 characters. They are never an empty string.

### Examples

#### Example 1

If we add a user such as:
`{ "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "login": "frank", "password": "p4ssw0rd" }`
and then call `POST /main-task/authenticate` with the same login and password, an example response can be:
`{ "token" : "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed" }`

#### Example 2

If the user from Example 1 creates the following blog posts:

`{ "postId": "f1d4d56d-1812-448b-a388-78bdfb60f844", "title": "title1", "content": "content1", "visibility": "public"}`
`{ "postId": "ef1af5bd-f62a-4faa-ac2a-5c23bea9f59c", "title": "title2", "content": "content2", "visibility": "private"}`
`{ "postId": "69a4146a-49e2-43cd-92b0-18ea58ea3580", "title": "title3", "content": "content3", "visibility": "authenticated"}`

Then calling `GET /main-task/blog-posts` (with no token passed in the request's header) gives only one blog post object:

```json
[
    {
        "postId": "f1d4d56d-1812-448b-a388-78bdfb60f844",
        "title": "title1",
        "content": "content1",
        "visibility": "public",
        "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
]
```

But when the user's token is passed on as the `Authorization` header, all three blog post objects are returned.

Then, if we perform this sequence of actions:

1.  Create a new user
1.  Log the user in
1.  Call `GET /main-task/blog-posts` again with a new token

The following result is expected:

```json
[
    {
        "postId": "f1d4d56d-1812-448b-a388-78bdfb60f844",
        "title": "title1",
        "content": "content1",
        "visibility": "public",
        "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    },
    {
        "postId": "69a4146a-49e2-43cd-92b0-18ea58ea3580",
        "title": "title3",
        "content": "content3",
        "visibility": "authenticated",
        "userId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
]
```

#### Example 3

An example of the headers that are included into a POST request sent to the `/main-task/blog-posts` endpoint:

```json
{
    "content-type": "application/json",
    "Authorization": "bde6708a-0d14-48d7-9e30-ffc71d1d7667"
}
```
