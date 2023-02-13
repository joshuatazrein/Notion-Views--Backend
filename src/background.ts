import { DataRequest, processRequest, MyApi } from './backgroundApi'

const api: MyApi = {
  google: {
    // @ts-ignore
    getAuthToken: async () => await chrome.identity.getAuthToken()
  },
  btoa: (data: string) => btoa(data)
}

chrome.runtime.onMessage.addListener(
  (
    {
      type,
      action,
      data
    }: { type: string; action: string; data?: DataRequest },
    sender,
    sendResponse
  ) => {
    data.user_id = 'CHROME' // dummy ID for the purpose of the server API
    processRequest(type, action, data, sendResponse, api)
    return true
  }
)
