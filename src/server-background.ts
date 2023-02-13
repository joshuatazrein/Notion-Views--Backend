import cors from 'cors'
import express from 'express'
import { DataRequest, processRequest, MyApi } from './backgroundApi'
import { GoogleAuth } from 'google-auth-library'
import fs from 'fs'

const app = express()
const port = process.env.PORT || 3001

const api: MyApi = {
  google: {
    getAuthToken: async () => {}
  },
  btoa: data => Buffer.from(data).toString('base64')
}

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
      data
    }: { type: string; action: string; data: DataRequest } = req.body
    console.log('processing request:', type, action, data)
    processRequest(
      type,
      action,
      data,
      response => {
        console.log('success with response', response)
        res.status(200).send(response)
      },
      api
    )
  } catch (err) {
    res.status(400).send(err.message)
  }
})
