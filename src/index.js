import R from 'ramda';

import util from './mam/util';
import mam from './mam/mam';
import fb from './mam/fb';
import config from './mam/configuration';
import log from './mam/log';
import { curried as mm } from './mam/mm';

const FB_LAST_POST_PATH = './last-post.json';

(async function main() {
  const configuration = await config.getConfiguration();
  const lastPost = await mam.tryGetLastPost(FB_LAST_POST_PATH);
  const schedule = mam.getSchedule(configuration.SCHEDULE);
  const pollIntervalMillis = util.parseToMillis(configuration.POLL_INTERVAL);
  const pollDurationMillis = util.parseToMillis(configuration.POLL_DURATION);
  const ctx = R.merge(mam.getCtx(pollIntervalMillis, pollDurationMillis), { lastPost, schedule });
  await mam.execute(ctx, task);
}());

/////////////////////////////////////////////////////////////

async function task(ctx) {
  log.info('Executing task');
  try {
    const newCtx = R.clone(ctx);
    const configuration = await config.getConfiguration();
    const feed = await fb.getFeed(configuration.FB_ACCESS_TOKEN, configuration.FB_USER_ID);
    const posts = fb.getPostsOfLatestDay(ctx.lastPost, feed);
    if (posts.length) {
      const postToMattermost = mm.postToMattermost(configuration.MM_WEBHOOK_URL);

      await posts.reduce((prevPromise, post) =>
        prevPromise.then(() => {
          postToMattermost({
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            text: post.message,
            icon_url: configuration.MM_ICON_URL,
            username: configuration.MM_USERNAME,
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          });
        }), Promise.resolve());

      newCtx.lastPost = posts[0];
      await mam.saveLastPost(FB_LAST_POST_PATH, newCtx.lastPost);
    }
    else {
      log.info('No new posts');
    }

    return newCtx;
  }
  catch (ex) {
    log.error(ex);
    throw ex;
  }
}
