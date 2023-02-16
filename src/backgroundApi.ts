import { Client as Notion, collectPaginatedAPI } from '@notionhq/client'
import { TokenResponse } from 'google-auth-library/build/src/auth/impersonated'
import _ from 'lodash'
import { stderr } from 'process'

export const processRequest = async (
  type: 'google' | 'notion',
  action: string,
  data: Record<string, any>,
  sendResponse: (response?: Record<string, any>) => void,
  fetchFunction: typeof fetch,
  access_token?: string
) => {
  let response: any
  if (!fetchFunction) {
    fetchFunction = fetch
  }

  if (type === 'google') {
    const gRequest = async (
      url: string,
      method: string = 'GET',
      params?: Record<string, string>,
      data?: Record<string, any>,
      stripKeys?: string[]
    ) => {
      {
        if (stripKeys && data) {
          data = _.omit(data, stripKeys)
        }
      }
      try {
        const f = await fetchFunction(
          url + (params ? '?' + new URLSearchParams(params) : ''),
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            method,
            body: data ? JSON.stringify(data) : undefined
          }
        )

        let result: Record<string, any> | string
        const textResponse = await f.text()
        try {
          result = JSON.parse(textResponse)
        } catch (err) {
          result = textResponse
        }

        // pass back the new tokens back to the app for storage
        return result
      } catch (err) {
        stderr.write(
          `\nERROR AT ${new Date().toDateString()}: ${
            err.message
          }, from request ${action} with data:\n    ${JSON.stringify(data)}`
        )
        return 'ERROR: ' + err.message
      }
    }

    switch (action) {
      case 'events.insert':
        response = await gRequest(
          `https://www.googleapis.com/calendar/v3/calendars/${data.calendarId}/events`,
          'POST',
          undefined,
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
          undefined,
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
