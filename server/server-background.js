"use strict";

var _cors = _interopRequireDefault(require("cors"));
var _express = _interopRequireDefault(require("express"));
var _fs = require("fs");
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _process = require("process");
var _backgroundApi = require("./backgroundApi.js");
var _googleAuthLibrary = require("google-auth-library");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// backports to older version of node

const keys = JSON.parse((0, _fs.readFileSync)('./keys.json').toString('utf-8'));
const SERVER = process.env.NODE_ENV === 'PRODUCTION' || process.env.NODE_ENV === 'Production' ? 'https://riverrun.app/server' : 'http://localhost:3001/server';
var _exports = {};
const app = (0, _express.default)();
const port = 3001;
var allowedDomains = ['capacitor://localhost', 'http://localhost:3000', 'https://api.notion.com', 'https://riverrun.app'];
app.use((0, _cors.default)({
  origin: function (origin, callback) {
    // bypass the requests with no origin (like curl requests, mobile apps, etc )
    if (!origin) return callback(null, true);
    if (allowedDomains.indexOf(origin) === -1) {
      var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use('/server/request', _express.default.json());
app.post('/server/request', async (req, res) => {
  try {
    const {
      type,
      action,
      data,
      access_token
    } = req.body;
    if (type === 'auth') {
      throw new Error("server backend doesn't handle Google tokens");
    } else {
      (0, _backgroundApi.processRequest)(type, action, data, response => {
        _process.stdout.write('\n\nGOT RESPONSE: ' + JSON.stringify(response));
        res.status(200).send(response);
      },
      // @ts-ignore
      _nodeFetch.default, access_token);
    }
  } catch (err) {
    _process.stderr.write(err.message);
    res.status(400).send(err.message);
  }
});
app.get('/server/sign-in/notion', async (req, res) => {
  try {
    const {
      code,
      state
    } = req.query;
    const basicHeader = Buffer.from(`${keys.notion.client_id}:${keys.notion.client_secret}`, 'utf-8').toString('base64');
    console.log('got stuff:', code, state);
    (0, _nodeFetch.default)('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicHeader}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SERVER + '/sign-in/notion'
      })
    }).then(async token => {
      const notion_tokens = await token.text(); // pass on JSON string
      console.log('got token', notion_tokens);
      res.redirect(`${state === 'mobile' ? 'capacitor://localhost' : state === 'web' ? 'https://riverrun.app' : state === 'localhost' ? 'http://localhost:3000' : 'ERROR'}?notion_tokens=${notion_tokens}`);
    }, error => {
      console.log(error.message);
    });
  } catch (err) {
    console.log(err.message);
    res.status(400).send(err.message);
  }
});
app.get('/server/sign-in/google', async (req, res) => {
  try {
    const {
      code,
      state
    } = req.query;
    const oAuth2Client = new _googleAuthLibrary.OAuth2Client(keys.google.client_id, keys.google.client_secret, SERVER + '/sign-in/google');
    const token = await oAuth2Client.getToken(code);
    console.log('got tokens:', token);
    const formattedTokens = {
      access_token: token.tokens.access_token,
      refresh_token: token.tokens.refresh_token,
      expire_time: token.tokens.expiry_date
    };
    res.redirect(`${state === 'mobile' ? 'capacitor://localhost' : state === 'web' ? 'https://riverrun.app' : state === 'localhost' ? 'http://localhost:3000' : 'ERROR'}?google_tokens=${JSON.stringify(formattedTokens)}`);
  } catch (err) {
    console.log(err.message);
    res.status(400).send(err.message);
  }
});
app.listen(port, () => console.log('listening on port', port, 'from', SERVER));