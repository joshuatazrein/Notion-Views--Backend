var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Client as Notion, collectPaginatedAPI } from '@notionhq/client';
import _ from 'lodash';
export const processRequest = (type, action, data, sendResponse, access_token) => __awaiter(void 0, void 0, void 0, function* () {
    let response;
    if (type === 'google') {
        const gRequest = (url, method = 'GET', params, data, stripKeys) => __awaiter(void 0, void 0, void 0, function* () {
            {
                if (stripKeys && data) {
                    data = _.omit(data, stripKeys);
                }
            }
            const f = yield fetch(url + (params ? '?' + new URLSearchParams(params) : ''), {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                method,
                body: data ? JSON.stringify(data) : undefined
            });
            let result;
            try {
                result = f.json();
            }
            catch (err) {
                result = f;
            }
            // pass back the new tokens back to the app for storage
            return result;
        });
        switch (action) {
            case 'events.insert':
                response = yield gRequest(`https://www.googleapis.com/calendar/v3/calendars/${data.calendarId}/events`, 'POST', undefined, data, ['calendarId']);
                break;
            case 'events.delete':
                response = yield gRequest(`https://www.googleapis.com/calendar/v3/calendars/${data.calendarId}/events/${data.eventId}`, 'DELETE');
                break;
            case 'events.patch':
                response = yield gRequest(`https://www.googleapis.com/calendar/v3/calendars/${data.calendarId}/events/${data.eventId}`, 'PATCH', undefined, data, ['calendarId', 'eventId']);
                break;
            case 'calendarList.list':
                response = yield gRequest(`https://www.googleapis.com/calendar/v3/users/me/calendarList`, 'GET', data.params);
                break;
            case 'events.list':
                const cId = data.calendarId;
                delete data.calendarId;
                response = yield gRequest(`https://www.googleapis.com/calendar/v3/calendars/${cId}/events`, 'GET', data.params);
                if (response.error) {
                    response = { items: [], error: response.error };
                }
                break;
            default:
                break;
        }
    }
    else if (type === 'notion') {
        let notion;
        const access_token = data.access_token;
        notion = new Notion({
            auth: access_token
        });
        switch (action) {
            case 'search':
                response = yield notion.search(data);
                break;
            case 'databases.retrieve':
                response = yield notion.databases.retrieve(data);
                break;
            case 'databases.query':
                response = yield collectPaginatedAPI(notion.databases.query, data);
                break;
            case 'pages.update':
                response = yield notion.pages.update(data);
                break;
            case 'pages.create':
                response = yield notion.pages.create(data);
                break;
            case 'pages.retrieve':
                response = yield notion.pages.retrieve(data);
                break;
            case 'pages.properties.retrieveRelation':
                // only works with relations and other paginated properties
                response = yield collectPaginatedAPI(notion.pages.properties.retrieve, data);
                break;
            default:
                break;
        }
    }
    sendResponse(response);
});
