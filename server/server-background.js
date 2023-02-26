"use strict";

var _cors = _interopRequireDefault(require("cors"));
var _express = _interopRequireDefault(require("express"));
var _backgroundApi = require("./backgroundApi");
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _process = require("process");
var _keys = _interopRequireDefault(require("./keys.json"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// backports to older version of node

const CLIENT = 'http://localhost:3000';
// const CLIENT = 'https://riverrun.app'
// const CLIENT = 'capacitor://localhost'

const app = (0, _express.default)();
const port = 3001;
var allowedDomains = ['capacitor://localhost', 'http://localhost:3000', 'https://api.notion.com'];
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
      redirect_uri
    } = req.query;
    const basicHeader = Buffer.from(`${_keys.default.notion.client_id}:${_keys.default.notion.client_secret}`, 'utf-8').toString('base64');
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
        redirect_uri
      })
    }).then(async token => {
      console.log('got the thing');
      const notion_tokens = await token.text();
      console.log('got token', notion_tokens);
      res.redirect(`${CLIENT}?notion_tokens=${notion_tokens}`);
    }, error => {
      console.log(error.message);
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});
app.listen(port, () => console.log('listening on port', port));