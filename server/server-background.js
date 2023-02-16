"use strict";

var _cors = _interopRequireDefault(require("cors"));
var _express = _interopRequireDefault(require("express"));
var _backgroundApi = require("./backgroundApi.js");
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _process = require("process");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// backports to older version of node

// const SERVER = 'http://localhost:3001/server'
const SERVER = 'https://riverrun.app/server';
const app = (0, _express.default)();
const port = 3001;
var allowedDomains = ['capacitor://localhost', 'http://localhost:3000'];
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
    res.status(400).send(err.message);
  }
});

// app.get('/server/sign_in/notion', async (req, res) => {
//   try {
//     const { code, redirect_uri } = req.query
//     await processRequest(
//       'auth',
//       'notion.signIn',
//       {
//         code,
//         redirect_uri: `${SERVER}/sign_in/notion`
//       },
//       response => {
//         res.status(200).send(response)
//         // res.redirect(200, 'capacitor://localhost')
//       },
//       api
//     )
//   } catch (err) {
//     res.status(400).send(err.message)
//   }
// })

app.listen(port, () => console.log('listening on port', port));