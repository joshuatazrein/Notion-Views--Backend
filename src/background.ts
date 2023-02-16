import { processRequest } from './backgroundApi'

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
      data: Record<string, any>
      access_token: string
    },
    sender,
    sendResponse
  ) => {
    if (type === 'auth') {
      switch (action) {
        case 'google.getToken':
          chrome.identity.getAuthToken({}, token => sendResponse(token))
          break
      }
    } else {
      if (access_token === 'GOOGLE_TOKEN') {
        // pass in a dummy for the Chrome extension
        chrome.identity.getAuthToken({}, access_token => {
          processRequest(type, action, data, sendResponse, fetch, access_token)
        })
      } else {
        processRequest(type, action, data, sendResponse, fetch, access_token)
      }
    }
    return true
  }
)
