import cors from 'cors'
import express from 'express'
import { processRequest } from './backgroundApi.js'
import fetch from 'node-fetch' // backports to older version of node
import { stdout } from 'process'

// const SERVER = 'http://localhost:3001/server'
const SERVER = 'https://riverrun.app/server'

const app = express()
const port = 3001

var allowedDomains = ['capacitor://localhost', 'http://localhost:3000']
app.use(
  cors({
    origin: function (origin, callback) {
      // bypass the requests with no origin (like curl requests, mobile apps, etc )
      if (!origin) return callback(null, true)

      if (allowedDomains.indexOf(origin) === -1) {
        var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`
        return callback(new Error(msg), false)
      }
      return callback(null, true)
    }
  })
)

app.use('/server/request', express.json())
app.post('/server/request', async (req, res) => {
  try {
    const {
      type,
      action,
      data,
      access_token
    }: {
      type: 'notion' | 'google' | 'auth'
      action: string
      data: Record<string, any>
      access_token: string
    } = req.body
    if (type === 'auth') {
      throw new Error("server backend doesn't handle Google tokens")
    } else {
      processRequest(
        type,
        action,
        data,
        response => {
          stdout.write('\n\nGOT RESPONSE: ' + JSON.stringify(response))
          res.status(200).send(response)
        },
        // @ts-ignore
        fetch,
        access_token
      )
    }
  } catch (err) {
    res.status(400).send(err.message)
  }
})

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

app.listen(port, () => console.log('listening on port', port))
