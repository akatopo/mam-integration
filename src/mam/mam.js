// import util from './util';
import fs from 'mz/fs';
// import path from 'path';
import later from 'later';
import R from 'ramda';

// const DEFAULT_POLL_INTERVAL_MILLIS = util.parseToMillis('15m');
// const DEFAULT_POLL_DURATION_MILLIS = util.parseToMillis('5h');
// const DEFAULT_SCHEDULE = 'at 7:00 am except on Sat and Sun';

later.date.localTime();

const API = {
  tryGetLastPost,
  saveLastPost,
  getSchedule,
  getCtx,
  execute,
};

export default API;

export const curried = R.map(R.curry, API);

/////////////////////////////////////////////////////////////

async function tryGetLastPost(postPath) {
  try {
    await fs.stat(postPath);
    const post = JSON.parse(await fs.readFile(postPath, 'utf-8'));
    return post;
  }
  catch (ex) {
    return undefined;
  }
}

async function saveLastPost(postPath, post) {
  try {
    await fs.writeFile(postPath, JSON.stringify(post), 'utf8');
  }
  catch (ex) {
    throw ex;
  }
}

function getSchedule(text) {
  const schedule = later.parse.text(text);

  return schedule;
}

function getCtx(pollIntervalMillis, pollDurationMillis) {
  return {
    lastPost: undefined,
    schedule: undefined,
    currentPollMillis: undefined,
    pollIntervalMillis,
    pollDurationMillis,
  };
}

async function execute(ctx, asyncFunction) {
  // const newCtx = {
  //   lastPost: ctx.lastPost && R.clone(ctx.lastPost),
  //   schedule: ctx.schedule && R.clone(ctx.schedule) || getSchedule(),
  //   pollIntervalMillis: R.is(Number, ctx.pollIntervalMillis) ?
  //     ctx.pollIntervalMillis :
  //     DEFAULT_POLL_INTERVAL_MILLIS,
  //   pollDurationMillis: R.is(Number, ctx.pollDurationMillis) ?
  //     ctx.pollDurationMillis :
  //     DEFAULT_POLL_DURATION_MILLIS,
  // };
  const newCtx = R.clone(ctx);

  const onTimeoutPartial = R.partial(onTimeout, [newCtx, asyncFunction]);
  return later.setTimeout(onTimeoutPartial, newCtx.schedule);
}

async function onTimeout(ctx, asyncFunction) {
  let newCtx = R.clone(ctx);
  newCtx = await asyncFunction(newCtx);
  newCtx.currentPollMillis = newCtx.currentPollMillis === undefined ?
    0 :
    newCtx.currentPollMillis + newCtx.pollIntervalMillis;

  if (newCtx.currentPollMillis >= newCtx.pollDurationMillis) {
    newCtx.currentPollMillis = undefined;
    await execute(newCtx, asyncFunction);
  }
  else {
    const onTimeoutPartial = R.partial(onTimeout, [newCtx, asyncFunction]);
    setTimeout(onTimeoutPartial, newCtx.pollIntervalMillis);
  }
}
