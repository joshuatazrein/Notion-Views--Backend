"use strict";

var _backgroundApi = require("./backgroundApi");
chrome.runtime.onMessage.addListener(({
  type,
  action,
  data,
  access_token
}, sender, sendResponse) => {
  if (type === 'auth') {
    switch (action) {
      case 'google.getToken':
        chrome.identity.getAuthToken({}, token => sendResponse(token));
        break;
    }
  } else {
    if (access_token === 'GOOGLE_TOKEN') {
      // pass in a dummy for the Chrome extension
      chrome.identity.getAuthToken({}, access_token => {
        (0, _backgroundApi.processRequest)(type, action, data, sendResponse, access_token);
      });
    } else {
      (0, _backgroundApi.processRequest)(type, action, data, sendResponse, access_token);
    }
  }
  return true;
});