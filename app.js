const bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');
const cookieParser = require('cookie-parser');
const nocache = require('nocache');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const SESSION_IDS = new Map();
  // Applying middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(nocache());

// Views
app.use(express.static('views'));

app.post('/session', (req, res) => {
    const sessionID = req.cookies['session-id'];
    console.log(sessionID);
    console.log(SESSION_IDS)
    if (SESSION_IDS.get(sessionID) != undefined) {
        console.log("POST /tokens: Valid Session ID Found !");
        const response = {token: SESSION_IDS.get(sessionID)};
        res.json(response);
    } else {
        console.log("POST /tokens: No Valid Session ID Found !");
        const error = {status: 400, message: 'Invalid Session ID'};
        res.status(400).json(error)
    }
});

app.get('/', (req, res) => {
    const sessionID = req.cookies['session-id'];
    console.log(sessionID);
    if (sessionID && SESSION_IDS.get(sessionID)) {
        console.log("Valid Session Found !");
        res.sendFile('views/transfer.html', {root: __dirname});
    } else {
        console.log("No Valid Session Found !");
        res.sendFile('views/login.html', {root: __dirname});
    }
});

app.post('/authenticate', (req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    if (username && password && username === 'admin' && password==='admin') {

        // Generate Session ID and Token
        const SESSION_ID = uuidv1();
        const CSRF_TOKEN = uuidv4();

        // Store CSRF token in the map
        SESSION_IDS.set(SESSION_ID,CSRF_TOKEN)

        // Set session-id cookie
        res.setHeader('Set-Cookie', [`session-id=${SESSION_ID}`, `time=${Date.now()}`]);

        // Send transfer html
        res.sendFile('views/transfer.html', {root: __dirname});
    } else {
        const error = {status: 401, message: 'Invalid Credentials'};
        res.sendFile('views/invalid-login.html', {root: __dirname});
    }

});

// Submit form data
app.post('/transfer', (req, res) => {

    const transferName = req.body.inputTitle;
    const transferAccount = req.body.inputContent;
    const transferValue = req.body.transferValue;
    const transferComment = req.body.transferComment;
    const csrfToken = req.body.csrfToken;
    const sessionID = req.cookies['session-id'];
    // Checking if Session ID matches CSRF Cookie
    if (SESSION_IDS.get(sessionID) && SESSION_IDS.get(sessionID) === csrfToken) {
        console.log(`Tranfered ${transferValue}`);
        console.log("Valid Transfer Found !");
        res.sendFile('views/transfer-success.html', {root: __dirname});
    } else {
        console.log("Invalid CSRF Token");
        res.sendFile('views/form-error.html', {root: __dirname});
    }

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))