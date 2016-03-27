import R from 'ramda';

import mam from './mam/mam';
import fb from './mam/fb';
import cred from './mam/credentials';
import util from './mam/util';
import log from './mam/log';
import { curried as mm } from './mam/mm';

const FB_LAST_POST_PATH = './last-post.json';
const MM_ICON_URL = 'https://lh3.googleusercontent.com/5oh994t2XLUThXYZQgeH3lv7Zv0cAHh8qJPuK82tqES6oFDASv4j43D0Hsps84_IhjM=w300';
const MM_USERNAME = 'MamBot';

(async function main() {
  const lastPost = await mam.tryGetLastPost(FB_LAST_POST_PATH);
  const schedule = mam.getSchedule('every 15 minutes');
  const ctx = R.merge(mam.getCtx(0, 0), { lastPost, schedule });
  ctx.schedule = schedule;
  ctx.lastPost = lastPost;
  await mam.execute(ctx, task);
}());

/////////////////////////////////////////////////////////////

async function task(ctx) {
  log.info('Executing task');
  try {
    const newCtx = R.clone(ctx);
    const credentials = await cred.getCredentials();
    const feed = await fb.getFeed(credentials.FB_ACCESS_TOKEN, credentials.FB_USER_ID);
    const posts = fb.getPostsOfLatestDay(ctx.lastPost, feed);
    if (posts.length) {
      const postToMattermost = mm.postToMattermost(credentials.MM_WEBHOOK_URL);
      const postPromises = posts.map((post) => postToMattermost({
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        text: post.message,
        icon_url: MM_ICON_URL,
        username: MM_USERNAME,
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      }));
      await Promise.all(postPromises);
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
