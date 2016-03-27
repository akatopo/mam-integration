/* globals describe, it, expect, afterEach, beforeEach, jasmine */

import R from 'ramda';
// load mockFs before thenifying fs
import mockFs from 'mock-fs';
import a from 'a';
// using require to mock log
a.expectRequire('./log').return(require('./mam-log.mock'));
const credentials = require('../src/mam/credentials').default;

describe('credentials', () => {
  describe('has an API that', () => {
    it('should have a getCredentials function', () => {
      expect(typeof credentials.getCredentials).toBe('function');
    });
  });

  describe('has a getCredentials function that', () => {
    let credentialsObj = undefined;

    beforeEach(() => {
      credentialsObj = {
        FB_ACCESS_TOKEN: 'XXX',
        FB_USER_ID: 'XXX',
        MM_WEBHOOK_URL: 'XXX',
      };
    });

    afterEach(mockFs.restore);
    afterEach(() => {
      delete process.env.MAM_FB_ACCESS_TOKEN;
      delete process.env.MAM_FB_USER_ID;
      delete process.env.MAM_MM_WEBHOOK_URL;
    });

    it('should load credentials from ${cwd}/credentials.json if no path is provided', (done) => {
      mockFs({
        [`${process.cwd()}/credentials.json`]: JSON.stringify(credentialsObj),
      });

      credentials.getCredentials()
        .then((res) => {
          expect(res).toEqual(credentialsObj);
        })
        .then(done);
    });

    it('should load credentials from path if it is provided', (done) => {
      const path = '/path/credentials.json';

      mockFs({
        [path]: JSON.stringify(credentialsObj),
      });

      credentials.getCredentials(path)
        .then((res) => {
          expect(res).toEqual(credentialsObj);
        })
        .then(done);
    });

    it([
      'should load credentials from ENV if no path is provided and',
      'if no credentials.json is in ${CWD}',
    ].join(' '), (done) => {
      mockFs({});

      process.env = R.merge(process.env, {
        MAM_FB_ACCESS_TOKEN: credentialsObj.FB_ACCESS_TOKEN,
        MAM_FB_USER_ID: credentialsObj.FB_USER_ID,
        MAM_MM_WEBHOOK_URL: credentialsObj.MM_WEBHOOK_URL,
      });

      credentials.getCredentials()
        .then((res) => {
          expect(res).toEqual(credentialsObj);
        })
        .then(done);
    });

    // TODO: Add tests for invalid credential schemas/values
  });
});
