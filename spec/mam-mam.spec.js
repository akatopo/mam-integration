/* globals describe, it, expect, afterEach, beforeEach, jasmine, spyOn */

// load mockFs before thenifying fs
import mockFs from 'mock-fs';
import lolex from 'lolex';
import later from 'later';
import mam from '../src/mam/mam';
import util from '../src/mam/util';
import fs from 'mz/fs';
import R from 'ramda';

describe('mam', () => {
  describe('has an API that', () => {
    it('should have a tryGetLastPost function', () => {
      expect(typeof mam.tryGetLastPost).toBe('function');
    });
  });

  describe('loads later.js', () => {
    it('set to use local time', () => {
      expect(later.date.isUTC).toBe(false);
    });
  });

  describe('has a tryGetLastPost function that given a path', () => {
    afterEach(mockFs.restore);

    it('returns undefined if no file exists', (done) => {
      mockFs({
        '/path': '',
      });
      mam.tryGetLastPost('/invalid-path')
        .then((res) => {
          expect(res).toBe(undefined);
        })
        .then(done);
    });

    it('returns undefined if the file exists but is invalid JSON', (done) => {
      mockFs({
        '/path': '{"invalid-json": }',
      });
      mam.tryGetLastPost('/path')
        .then((res) => {
          expect(res).toBe(undefined);
        })
        .then(done);
    });

    it('returns a parsed JSON object if the file exists and is valid JSON', (done) => {
      const o = {
        str: 's',
      };
      mockFs({
        '/path/file.json': JSON.stringify(o),
      });
      mam.tryGetLastPost('/path/file.json')
        .then((res) => {
          expect(res).toEqual(o);
        })
        .then(done);
    });
  });

  describe('has a saveLastPost function that given a path and an object', () => {
    afterEach(mockFs.restore);

    it('will save the post to the path given', (done) => {
      const o = {
        str: 's',
      };
      const path = '/file.json';
      mockFs({
        '/path': '',
      });
      mam.saveLastPost(path, o)
        .then(() => {
          expect(JSON.parse(fs.readFileSync(path, 'utf-8'))).toEqual(o);
        })
        .then(done);
    });

    it('will throw an exception if it cannot save the file to the path given', (done) => {
      const o = {
        str: 's',
      };
      const path = '/invalid-dir/file.json';
      mockFs({
        '/path': '',
      });

      mam.saveLastPost(path, o)
        .then(() => {
          expect(true).toBe(false);
        }, done);
    });
  });

  describe('has a getSchedule function that', () => {
    let clock;

    beforeEach(() => {
      clock = lolex.install(global, new Date(2016, 1, 29)); // Feb 29, 2016
    });

    afterEach(() => clock && clock.uninstall());

    it('returns a later schedule', () => {
      const schedule = mam.getSchedule('at 7:00 am except on Sat and Sun');
      const occurrences = later.schedule(schedule).next(10);

      expect(occurrences).toEqual(jasmine.any(Array));
      occurrences.forEach((occurence) => {
        // Sat(6), Sun(0)
        expect(occurence.getDay() in { 6: false, 0: false }).toBe(false);
        // 7am (local time)
        expect(occurence.getHours()).toBe(7);
        expect(occurence.getMinutes()).toBe(0);
      });
    });
  });

  describe('has an execute function that', () => {
    let clock;

    beforeEach(() => {
      clock = lolex.install(global, new Date(2016, 1, 29, 0, 0, 0, 0)); // 12am Feb 29, 2016
    });

    afterEach(() => clock && clock.uninstall());

    it([
      'runs a task exactly once per scheduled run',
      'if poll duration and interval are zero',
    ].join(' '), (done) => {
      const schedule = later.parse.text('every 5 seconds');
      const ctx = {
        lastPost: undefined,
        schedule,
        pollIntervalMillis: 0,
        pollDurationMillis: 0,
      };
      const spyContainer = {
        testTask: asyncIdentity,
      };
      spyOn(spyContainer, 'testTask').and.callThrough();

      const execPromise = mam.execute(ctx, spyContainer.testTask);

      execPromise
        .then(() => {
          clock.tick(util.parseToMillis('5s'));
          expect(spyContainer.testTask.calls.count()).toBe(1);
        })
        .then(() => {
          clock.tick(util.parseToMillis('5s'));
          expect(spyContainer.testTask.calls.count()).toBe(2);
        })
        .then(done);
    });

    it([
      'runs a task floor(poll duration / poll interval) times per scheduled run',
      'if poll duration is greater than poll interval',
    ].join(' '), (done) => {
      const schedule = later.parse.text('at 7:00 am except on Sat and Sun');
      const ctx = {
        lastPost: undefined,
        schedule,
        pollIntervalMillis: util.parseToMillis('15m'),
        pollDurationMillis: util.parseToMillis('3h'),
      };
      const spyContainer = {
        testTask: asyncIdentity,
      };
      spyOn(spyContainer, 'testTask').and.callThrough();

      const execPromise = mam.execute(ctx, spyContainer.testTask);

      let testDayPromise = testDay(execPromise);
      const tenIterations = range(0, 10);
      while (!tenIterations.next().done) {
        testDayPromise = testDayPromise
          .then((res) => { testDay(res); });
      }
      testDayPromise.then(done);

      /////////////////////////////////////////////////////////////

      async function testDay(promise) {
        spyContainer.testTask.calls.reset();

        let pollPromise = promise.then(() => {
          clock.tick(util.parseToMillis('7h'));
          expectTaskCalls(spyContainer.testTask.calls, 1);
        });

        let currentPollDurationMillis = 0;
        let iteration = 1;
        while (currentPollDurationMillis < ctx.pollDurationMillis) {
          iteration = iteration + 1;
          pollPromise = pollPromise.then(R.partial(testPoll, [iteration]));
          currentPollDurationMillis = currentPollDurationMillis + util.parseToMillis('15m');
        }
        expect(iteration).toBe(13);

        return pollPromise
          .then(() => {
            clock.tick(util.parseToMillis('14h')); // end the day
            expectTaskCalls(spyContainer.testTask.calls, iteration);
          });
      }

      function testPoll(i) {
        clock.tick('15:00');
        expectTaskCalls(spyContainer.testTask.calls, i);
      }

      function expectTaskCalls(calls, expectedCalls) {
        if ((new Date).getDay() in { 6: false, 0: false }) {
          expect(calls.count()).toBe(0);
        }
        else {
          expect(calls.count()).toBe(expectedCalls);
        }
      }
    });
  });
});

/////////////////////////////////////////////////////////////

async function asyncIdentity(x) {
  return x;
}

function * range(from, to) {
  if (!(Number.isInteger(from) && Number.isInteger(to))) {
    throw new TypeError('from and to must be integers');
  }

  for (let i = from; i <= to; ++i) {
    yield i;
  }
}
