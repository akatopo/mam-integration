import chalk from 'chalk';

export default {
  info,
  warn,
  error,
};

function info(s) {
  console.info(chalk.bgBlue('[ℹ INFO] '), chalk.gray(`[${new Date()}]`), s);
}

function warn(s) {
  console.warn(chalk.bgYellow('[⚠ WARN] '), chalk.gray(`[${new Date()}]`), s);
}

function error(s) {
  console.error(chalk.bgRed('[💣 ERROR]'), chalk.gray(`[${new Date()}]`), s);
}
