import { Client as Notion, collectPaginatedAPI } from '@notionhq/client'
import { TokenResponse } from 'google-auth-library/build/src/auth/impersonated'
import { omit } from 'lodash'

export type DataRequest = { access_token?: string } & Record<string, any>
import keys from './keys.json'
export type MyApi = {
  google: {
    getAuthToken:
      | (() => Promise<void>)
      | ((user_id: string) => Promise<TokenResponse>)
  }
  btoa: (data: string) => string
}

export const processRequest = async (
  type: string,
  action: string,
  data: DataRequest,
  sendResponse: (response?: any) => void,
  api: MyApi
) => {
  let response: any

  if (type === 'google') {
    // prettier-ignore
    // @ts-ignore
    const token: { token; grantedScopes } | null = await api.google.getAuthToken()

    if (!token) {
      sendResponse(undefined)
      return
    }

    const gRequest = async (
      url: string,
      method: string = 'GET',
      params?: Record<string, string>,
      data?: Record<string, any>,
      stripKeys?: string[]
    ) => {
      {
        if (stripKeys && data) {
          data = omit(data, stripKeys)
        }
      }
      const f = await fetch(
        url + (params ? '?' + new URLSearchParams(params) : ''),
        {
          headers: {
            Authorization: `Bearer ${token.token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method,
          body: data ? JSON.stringify(data) : undefined
        }
      )
      let result
      try {
        result = f.json()
      } catch (err) {
        result = f
      }
      return result
    }

    switch (action) {
      case 'events.insert':
        response = await gRequest(
          `https://www.googleapis.com/calendar/v3/calendars/${data.calendarId}/events`,
          'POST',
          null,
          data,
          ['calendarId']
        )

        break
      case 'events.delete':
        response = await gRequest(
          `https://www.googleapis.com/calendar/v3/calendars/${data.calendarId}/events/${data.eventId}`,
          'DELETE'
        )
        break
      case 'events.patch':
        response = await gRequest(
          `https://www.googleapis.com/calendar/v3/calendars/${data.calendarId}/events/${data.eventId}`,
          'PATCH',
          null,
          data,
          ['calendarId', 'eventId']
        )

        break
      case 'calendarList.list':
        response = await gRequest(
          `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
          'GET',
          data.params
        )
        break
      case 'events.list':
        const cId = data.calendarId
        delete data.calendarId
        response = await gRequest(
          `https://www.googleapis.com/calendar/v3/calendars/${cId}/events`,
          'GET',
          data.params
        )
        if (response.error) {
          response = { items: [], error: response.error }
        }

        break
      default:
        break
    }
  } else if (type === 'sign_in') {
    switch (action) {
      case 'notion':
        if (!data) return

        const basicHeader = api.btoa(
          `${keys.notion.client_id}:${keys.notion.client_secret}`
        )

        response = (
          await fetch('https://api.notion.com/v1/oauth/token', {
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
          })
        ).json()
        break
      case 'google':
        // TO DO: registration for Google-based stuff on the server
        // prettier-ignore
        // @ts-ignore
        const token: { token; grantedScopes } | null = await api.google.getAuthToken()
        console.log('sign in to google with token:', token)
        response = token.token
        break
    }
  } else if (type === 'notion') {
    let notion: Notion

    const access_token = data.access_token
    notion = new Notion({
      auth: access_token
    })

    switch (action) {
      case 'search':
        response = await notion.search(data as any)
        break
      case 'databases.retrieve':
        response = await notion.databases.retrieve(data as any)
        break
      case 'databases.query':
        response = await collectPaginatedAPI(
          notion.databases.query,
          data as any
        )
        break
      case 'pages.update':
        response = await notion.pages.update(data as any)
        break
      case 'pages.create':
        response = await notion.pages.create(data as any)
        break
      case 'pages.retrieve':
        response = await notion.pages.retrieve(data as any)
        break
      case 'pages.properties.retrieveRelation':
        // only works with relations and other paginated properties
        response = await collectPaginatedAPI(
          notion.pages.properties.retrieve as any,
          data as any
        )
        break
      default:
        break
    }
  }
  sendResponse(response)
}
