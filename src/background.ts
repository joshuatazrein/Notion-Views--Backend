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
      access_token?: string
    },
    sender,
    sendResponse
  ) => {
    if (type === 'auth') {
      switch (action) {
        case 'google.requestToken':
          // prettier-ignore
          // @ts-ignore
          const token: { token; grantedScopes } | null = await chrome.identity.getAuthToken()
          sendResponse(token?.token)
          break
      }
    } else {
      processRequest(type, action, data, sendResponse, access_token)
    }
    return true
  }
)
