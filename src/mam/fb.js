import R from 'ramda';
// using require to mock request-promise and log
const request = require('request-promise');
const log = require('./log').default;

const FB_API_URL = 'https://graph.facebook.com';

const API = {
  getFeed,
  getPostsOfLatestDay,
};

export default API;

export const curried = R.map(R.curry, API);

/////////////////////////////////////////////////////////////

async function getFeed(accessToken, userId) {
  try {
    const feed = await request(
      `${FB_API_URL}/${userId}/posts/?access_token=${accessToken}`
    );
    log.info(`Fetched facebook posts for userId ${userId}`);

    return JSON.parse(feed);
  }
  catch (ex) {
    log.error(`Facebook /posts fetching failed with exception: ${ex}`);
    throw ex;
  }
}

function getPostsOfLatestDay(lastPost, feed) {
  const posts = feed.data;
  const latestDay = getPostDay(posts[0]);
  const latestDayPosts = posts.slice(
    0,
    posts.findIndex(R.compose(R.not, R.equals(latestDay), getPostDay))
  );
  const lastPostFeedIndex = lastPost ?
    latestDayPosts.findIndex(R.compose(R.equals(lastPost.id), R.prop('id'))) :
    -1;

  return (lastPostFeedIndex !== -1) ?
    latestDayPosts.slice(0, lastPostFeedIndex) :
    latestDayPosts;
}

function getPostDay(post) {
  return (new Date(R.prop('created_time', post))).getDay();
}
