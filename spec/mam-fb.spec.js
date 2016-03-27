/* globals describe, it, expect, afterEach, beforeEach, jasmine */

const fbFeed = require('./fb-posts.json');
let requestPromiseMockState = 'defaultState';

import R from 'ramda';
import a from 'a';

// using require to mock request-promise and log
a.expectRequire('request-promise').return(requestPromiseMock);
a.expectRequire('./log').return(require('./mam-log.mock'));
const fb = require('../src/mam/fb').default;

describe('fb', () => {
  describe('has an API that', () => {
    it('should have a getFeed function', () => {
      expect(typeof fb.getFeed).toBe('function');
    });

    it('should have a getPostsOfLatestDay function', () => {
      expect(typeof fb.getPostsOfLatestDay).toBe('function');
    });
  });

  describe('has a function getFeed that', () => {
    beforeEach(() => { requestPromiseMockState = 'defaultState'; });
    afterEach(() => { requestPromiseMockState = 'defaultState'; });

    it('should retrieve the posts from a fb public page', (done) => {
      fb.getFeed('acessToken', 'userId')
        .then((feed) => {
          expect(feed).toEqual(fbFeed);
        })
        .then(done);
    });

    it('should throw on fetch error', (done) => {
      requestPromiseMockState = 'throwsState';
      fb.getFeed('acessToken', 'userId')
        .then(() => {
          expect(true).toBe(false);
        }, done);
    });
  });

  describe('has a function getPostsOfLatestDay that', () => {
    it('should ', () => {
      const mockFeed = {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        data: [
          {
            created_time: '2016-03-01T09:03:53+0000',
            id: '1',
          },
          {
            created_time: '2016-02-29T08:34:00+0000',
            id: '2',
          },
          {
            created_time: '2016-02-28T08:34:00+0000',
            id: '3',
          },
        ],
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      };

      const posts = fb.getPostsOfLatestDay(undefined, mockFeed);
      expect(posts.length).toBe(1);
      expect(posts.map(R.prop('id'))).toEqual(['1']);
    });

    it('should ', () => {
      const mockFeed = {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        data: [
          {
            created_time: '2016-03-01T09:03:53+0000',
            id: '1',
          },
          {
            created_time: '2016-03-01T08:34:00+0000',
            id: '2',
          },
          {
            created_time: '2016-02-28T08:34:00+0000',
            id: '3',
          },
        ],
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      };

      const posts = fb.getPostsOfLatestDay(undefined, mockFeed);
      expect(posts.length).toBe(2);
      expect(posts.map(R.prop('id'))).toEqual(['1', '2']);
    });

    it('should ', () => {
      const mockFeed = {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        data: [
          {
            created_time: '2016-03-01T09:03:53+0000',
            id: '1',
          },
          {
            created_time: '2016-03-01T08:34:00+0000',
            id: '2',
          },
          {
            created_time: '2016-02-28T08:34:00+0000',
            id: '3',
          },
        ],
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      };

      const posts = fb.getPostsOfLatestDay({ id: '1' }, mockFeed);
      expect(posts.length).toBe(0);
    });

    it('should ', () => {
      const mockFeed = {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        data: [
          {
            created_time: '2016-03-01T09:03:53+0000',
            id: '1',
          },
          {
            created_time: '2016-03-01T08:34:00+0000',
            id: '2',
          },
          {
            created_time: '2016-02-28T08:34:00+0000',
            id: '3',
          },
          {
            created_time: '2016-02-27T08:34:00+0000',
            id: '4',
          },
        ],
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      };

      const posts = fb.getPostsOfLatestDay({ id: '4' }, mockFeed);
      expect(posts.length).toBe(2);
      expect(posts.map(R.prop('id'))).toEqual(['1', '2']);
    });

    it('should ', () => {
      const mockFeed = {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        data: [
          {
            created_time: '2016-03-01T09:03:53+0000',
            id: '1',
          },
          {
            created_time: '2016-03-01T08:34:00+0000',
            id: '2',
          },
          {
            created_time: '2016-03-01T08:24:00+0000',
            id: '3',
          },
          {
            created_time: '2016-02-27T08:34:00+0000',
            id: '4',
          },
        ],
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      };

      const posts = fb.getPostsOfLatestDay({ id: '2' }, mockFeed);
      expect(posts.length).toBe(1);
      expect(posts.map(R.prop('id'))).toEqual(['1']);
    });
  });
});

async function requestPromiseMock() {
  const dispatcher = {
    defaultState() {
      const response = JSON.stringify(fbFeed);
      return response;
    },
    throwsState() {
      throw new Error();
    },
  };

  return dispatcher[requestPromiseMockState || 'defaultState']();
}
