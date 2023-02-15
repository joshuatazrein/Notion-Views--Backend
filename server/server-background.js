"use strict";

var _cors = _interopRequireDefault(require("cors"));
var _express = _interopRequireDefault(require("express"));
var _backgroundApi = require("./backgroundApi.mjs");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const SERVER = 'http://localhost:3001/server';
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
        res.status(200).send(response);
      }, access_token);
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// app.get('/server/sign_in/notion', async (req, res) => {
//   try {
//     console.log('queries:', req.query)
//     const { code, redirect_uri } = req.query
//     console.log('got code', code, redirect_uri)
//     await processRequest(
//       'auth',
//       'notion.signIn',
//       {
//         code,
//         redirect_uri: `${SERVER}/sign_in/notion`
//       },
//       response => {
//         console.log('got response from tokens', response)
//         res.status(200).send(response)
//         // res.redirect(200, 'capacitor://localhost')
//       },
//       api
//     )
//   } catch (err) {
//     console.log(err.message)
//     res.status(400).send(err.message)
//   }
// })

app.listen(port, () => console.log('listening on port', port));