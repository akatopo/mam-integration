/* globals describe, it, expect, afterEach, beforeEach, jasmine */

import R from 'ramda';
// load mockFs before thenifying fs
import mockFs from 'mock-fs';
import a from 'a';
// using require to mock log
a.expectRequire('./log').return(require('./mam-log.mock'));
const configuration = require('../src/mam/configuration').default;

describe('configuration', () => {
  describe('has an API that', () => {
    it('should have a getConfiguration function', () => {
      expect(typeof configuration.getConfiguration).toBe('function');
    });
  });

  describe('has a getConfiguration function that', () => {
    let configurationObj = undefined;

    beforeEach(() => {
      configurationObj = {
        FB_ACCESS_TOKEN: 'XXX',
        FB_USER_ID: 'XXX',
        MM_WEBHOOK_URL: 'XXX',
        STRICT_SSL: true,
        MM_ICON_URL: 'https://cdnjs.cloudflare.com/ajax/libs/emojione/2.1.4/assets/png/1f32e.png',
        MM_USERNAME: 'MamBot',
        SCHEDULE: 'at 7:00 am except on Sat and Sun',
        POLL_INTERVAL: '25m',
        POLL_DURATION: '5h',
      };
    });

    afterEach(mockFs.restore);
    afterEach(() => {
      delete process.env.MAM_FB_ACCESS_TOKEN;
      delete process.env.MAM_FB_USER_ID;
      delete process.env.MAM_MM_WEBHOOK_URL;
    });

    it('should load configuration from ${cwd}/configuration.json if no path is provided', (done) => {
      mockFs({
        [`${process.cwd()}/configuration.json`]: JSON.stringify(configurationObj),
      });

      configuration.getConfiguration()
        .then((res) => {
          expect(res).toEqual(configurationObj);
        })
        .then(done);
    });

    it('should load configuration from path if it is provided', (done) => {
      const path = '/path/configuration.json';

      mockFs({
        [path]: JSON.stringify(configurationObj),
      });

      configuration.getConfiguration(path)
        .then((res) => {
          expect(res).toEqual(configurationObj);
        })
        .then(done);
    });

    it([
      'should load configuration from ENV if no path is provided and',
      'if no configuration.json is in ${CWD}',
    ].join(' '), (done) => {
      mockFs({});

      process.env = R.merge(process.env, {
        MAM_FB_ACCESS_TOKEN: configurationObj.FB_ACCESS_TOKEN,
        MAM_FB_USER_ID: configurationObj.FB_USER_ID,
        MAM_MM_WEBHOOK_URL: configurationObj.MM_WEBHOOK_URL,
      });

      configuration.getConfiguration()
        .then((res) => {
          expect(res).toEqual(configurationObj);
        })
        .then(done);
    });

    // TODO: Add tests for invalid credential schemas/values
  });
});
