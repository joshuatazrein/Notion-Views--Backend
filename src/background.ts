import { processRequest } from './backgroundApi.js'
import keys from './keys.json'

chrome.runtime.onMessage.addListener(
  (
    {
      type,
      action,
      data,
      access_token
    }: {
      type: 'google' | 'notion' | 'auth'
      action: string
      data: Record<string, string | number>
      access_token?: string
    },
    sender,
    sendResponse
  ) => {
    if (type === 'auth') {
      switch (action) {
        case 'notion.getToken':
          const basicHeader = btoa(
            `${keys.notion.client_id}:${keys.notion.client_secret}`
          )

          fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
              Authorization: `Basic ${basicHeader}`,
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              grant_type: 'authorization_code',
              code: data.code,
              redirect_uri: `https://hahgpoibcnamhkofphkaibhjcfogbkbl.chromiumapp.org`
            })
          }).then(
            async token => {
              console.log('got the thing')

              const notion_tokens = await token.json()
              console.log('got token')

              sendResponse({ notion_tokens })
            },
            error => {
              console.log(error.message)
            }
          )
          break
        case 'google.getToken':
          chrome.identity.getAuthToken({}, token => sendResponse(token))
          break
      }
    } else {
      if (access_token === 'GOOGLE_TOKEN') {
        chrome.identity.getAuthToken({}, access_token =>
          processRequest(type, action, data, sendResponse, fetch, access_token)
        )
      } else {
        processRequest(type, action, data, sendResponse, fetch, access_token)
      }
    }
    return true
  }
)
