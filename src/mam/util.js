export default {
  parseToMillis,
};

/////////////////////////////////////////////////////////////

function parseToMillis(duration) {
  const regex = /^(\d+)([dhms])$/;
  const millis = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  if (!regex.test(duration)) {
    return 0;
  }

  const res = regex.exec(duration);

  return Number.parseInt(res[1], 10) * millis[res[2]];
}
