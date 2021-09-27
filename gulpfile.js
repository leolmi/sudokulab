const gulp = require('gulp');
require('./tools/gulp/deploy');

gulp.task('deploy', gulp.series(
  'build_frontend',
  'build_backend',
  'compose',
  'end'));
