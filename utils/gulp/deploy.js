const { exec } = require('child_process');
const gulp = require('gulp');

const PROJECTS = {
  backend: 'api',
  frontend: 'sudoku'
}

function build(prj, cb) {
  exec(`nx build ${prj} --prod`, (err, stdout, stderr) => {
    if (!!err) return cb(err);
    cb();
  });
}

gulp.task('build-frontend', function(cb) {
  build(PROJECTS.frontend, cb);
});

gulp.task('build-backend', function(cb) {
  build(PROJECTS.backend, cb);
});

gulp.task('deploy', gulp.series(
  'build-backend',
  'build-frontend'
));
