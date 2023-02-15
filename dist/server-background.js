var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import cors from 'cors';
import express from 'express';
import { processRequest } from './backgroundApi';
const SERVER = 'http://localhost:3001/server';
const app = express();
const port = 3001;
var allowedDomains = ['capacitor://localhost', 'http://localhost:3000'];
app.use(cors({
    origin: function (origin, callback) {
        // bypass the requests with no origin (like curl requests, mobile apps, etc )
        if (!origin)
            return callback(null, true);
        if (allowedDomains.indexOf(origin) === -1) {
            var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));
app.use('/server/request', express.json());
app.post('/server/request', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, action, data, access_token } = req.body;
        if (type === 'auth') {
            throw new Error("server backend doesn't handle Google tokens");
        }
        else {
            processRequest(type, action, data, response => {
                res.status(200).send(response);
            }, access_token);
        }
    }
    catch (err) {
        res.status(400).send(err.message);
    }
}));
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
