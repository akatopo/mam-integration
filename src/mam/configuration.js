import R from 'ramda';
import fs from 'mz/fs';
import path from 'path';
// using require to mock log
const log = require('./log').default;

const API = {
  getConfiguration,
};

const configurationDefaults = {
  STRICT_SSL: true,
  MM_ICON_URL: 'https://cdnjs.cloudflare.com/ajax/libs/emojione/2.1.4/assets/png/1f32e.png',
  MM_USERNAME: 'MamBot',
  SCHEDULE: 'at 7:00 am except on Sat and Sun',
  POLL_INTERVAL: '25m',
  POLL_DURATION: '5h',
};

const defaultTransformations = {
  getConfiguration(f) {
    return (
      configurationPath = path.resolve(process.cwd(), 'configuration.json'),
      ...remArgs
    ) => f(configurationPath, ...remArgs);
  },
};

export default R.evolve(defaultTransformations, API);

export const curried = R.map(R.curry, API);

/////////////////////////////////////////////////////////////


async function getConfiguration(configurationPath) {
  let configuration;

  try {
    configuration = JSON.parse(await fs.readFile(configurationPath, 'utf-8'));
  }
  catch (ex) {
    log.warn(
      `Couldn't find configuration in ${configurationPath}, loading from environment vars instead`
    );
    configuration = {
      FB_ACCESS_TOKEN: process.env.MAM_FB_ACCESS_TOKEN,
      FB_USER_ID: process.env.MAM_FB_USER_ID,
      MM_WEBHOOK_URL: process.env.MAM_MM_WEBHOOK_URL,
      STRICT_SSL: process.env.MAM_STRICT_SSL,
      MM_ICON_URL: process.env.MAM_MM_ICON_URL,
      MM_USERNAME: process.env.MAM_MM_USERNAME,
      SCHEDULE: process.env.MAM_MM_SCHEDULE,
      POLL_INTERVAL: process.env.MAM_POLL_INTERVAL,
      POLL_DURATION: process.env.MAM_MM_POLL_DURATION,
    };
  }
  finally {
    configuration = R.mergeWith(
      (left, right) => right === undefined ? left : right,
      configurationDefaults,
      configuration
    );
    Object.freeze(configuration);
  }

  return configuration;
}
