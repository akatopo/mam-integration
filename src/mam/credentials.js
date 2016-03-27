import R from 'ramda';
import fs from 'mz/fs';
import path from 'path';
// using require to mock log
const log = require('./log').default;

const API = {
  getCredentials,
};

const defaultTransformations = {
  getCredentials(f) {
    return (
      credentialsPath = path.resolve(process.cwd(), 'credentials.json'),
      ...remArgs
    ) => f(credentialsPath, ...remArgs);
  },
};

export default R.evolve(defaultTransformations, API);

export const curried = R.map(R.curry, API);

/////////////////////////////////////////////////////////////

async function getCredentials(credentialsPath) {
  let credentials;

  try {
    credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
  }
  catch (ex) {
    log.warn(
      `Couldn't find credentials in ${credentialsPath}, loading from environment vars instead`
    );
    credentials = {
      FB_ACCESS_TOKEN: process.env.MAM_FB_ACCESS_TOKEN,
      FB_USER_ID: process.env.MAM_FB_USER_ID,
      MM_WEBHOOK_URL: process.env.MAM_MM_WEBHOOK_URL,
    };
  }
  finally {
    Object.freeze(credentials);
  }

  return credentials;
}
