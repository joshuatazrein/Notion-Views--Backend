import cors from 'cors'
import express from 'express'
import fetch from 'node-fetch' // backports to older version of node
import { stdout, stderr } from 'process'
import keys from './keys.json'
import { processRequest } from './backgroundApi'

var exports = {}

const CLIENT = 'http://localhost:3000'
// const CLIENT = 'https://riverrun.app'
// const CLIENT = 'capacitor://localhost'

const app = express()
const port = 3001

var allowedDomains = [
  'capacitor://localhost',
  'http://localhost:3000',
  'https://api.notion.com'
]

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
  } catch (err: any) {
    stderr.write(err.message)
    res.status(400).send(err.message)
  }
})

app.get('/server/sign-in/notion', async (req, res) => {
  try {
    const { code, redirect_uri } = req.query
    const basicHeader = Buffer.from(
      `${keys.notion.client_id}:${keys.notion.client_secret}`,
      'utf-8'
    ).toString('base64')

    fetch('https://api.notion.com/v1/oauth/token', {
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
    }).then(
      async token => {
        console.log('got the thing')

        const notion_tokens = await token.text()
        console.log('got token', notion_tokens)
        res.redirect(`${CLIENT}?notion_tokens=${notion_tokens}`)
      },
      error => {
        console.log(error.message)
      }
    )
  } catch (err: any) {
    res.status(400).send(err.message)
  }
})

app.listen(port, () => console.log('listening on port', port))
