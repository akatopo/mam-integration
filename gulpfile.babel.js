// import streamqueue from 'streamqueue';
import del from 'del';

import gulp from 'gulp';
// import rename from 'gulp-rename';
// import runSequence from 'run-sequence';
import babel from 'gulp-babel';

gulp.task('compile-babel', compileBabel);

gulp.task('build', ['lib-clean'], compileBabel);

gulp.task('lib-clean', (cb) => {
  del('lib/*', { dot: true })
    .then(() => cb());
});

/////////////////////////////////////////////////////////////

function compileBabel() {
  return gulp.src('./src/**/*.js', { base: './src' })
    .pipe(babel())
    .pipe(gulp.dest('./lib/'));
}
