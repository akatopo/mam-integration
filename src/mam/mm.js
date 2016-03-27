import R from 'ramda';
// using require to mock request-promise and log
const request = require('request-promise');
const log = require('./log').default;

const API = {
  postToMattermost,
};

export default API;

export const curried = R.map(R.curry, API);

/////////////////////////////////////////////////////////////

async function postToMattermost(incomingWebhookUrl, payload) {
  try {
    const response = await request({
      method: 'POST',
      uri: incomingWebhookUrl,
      body: payload,
      json: true,
    });

    log.info(`Message posted to mattermost with response: ${response}`);
  }
  catch (ex) {
    log.error(`Posting failed with exception: ${ex}`);
    throw ex;
  }
}
