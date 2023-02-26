import cors from 'cors'
import express from 'express'
import { readFileSync } from 'fs'
import fetch from 'node-fetch' // backports to older version of node
import { stderr, stdout } from 'process'
import { processRequest } from './backgroundApi.mjs'
import { OAuth2Client } from 'google-auth-library'

const keys = JSON.parse(readFileSync('./keys.json').toString('utf-8'))

const SERVER =
  process.env.MODE === 'PRODUCTION'
    ? 'https://riverrun.app/server'
    : 'http://localhost:3001/server'

var exports = {}

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
    const { code, state } = req.query

    const basicHeader = Buffer.from(
      `${keys.notion.client_id}:${keys.notion.client_secret}`,
      'utf-8'
    ).toString('base64')
    console.log('got stuff:', code, state)

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
        redirect_uri: SERVER + '/sign-in/notion'
      })
    }).then(
      async token => {
        const notion_tokens = await token.text() // pass on JSON string
        console.log('got token', notion_tokens)
        res.redirect(
          `${
            state === 'mobile'
              ? 'capacitor://localhost'
              : state === 'web'
              ? 'https://riverrun.app'
              : state === 'localhost'
              ? 'http://localhost:3000'
              : 'ERROR'
          }?notion_tokens=${notion_tokens}`
        )
      },
      error => {
        console.log(error.message)
      }
    )
  } catch (err: any) {
    console.log(err.message)

    res.status(400).send(err.message)
  }
})

app.get('/server/sign-in/google', async (req, res) => {
  try {
    const { code, state } = req.query
    const oAuth2Client = new OAuth2Client(
      keys.google.client_id,
      keys.google.client_secret,
      SERVER + '/sign-in/google'
    )
    const token = await oAuth2Client.getToken(code as string)
    console.log('got tokens:', token)
    const formattedTokens = {
      access_token: token.tokens.access_token,
      refresh_token: token.tokens.refresh_token,
      expire_time: token.tokens.expiry_date
    }
    res.redirect(
      `${
        state === 'mobile'
          ? 'capacitor://localhost'
          : state === 'web'
          ? 'https://riverrun.app'
          : state === 'localhost'
          ? 'http://localhost:3000'
          : 'ERROR'
      }?google_tokens=${JSON.stringify(formattedTokens)}`
    )
  } catch (err: any) {
    console.log(err.message)

    res.status(400).send(err.message)
  }
})

app.listen(port, () => console.log('listening on port', port, 'from', SERVER))
