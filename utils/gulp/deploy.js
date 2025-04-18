const { exec } = require('child_process');
const gulp = require('gulp');
const fs = require('fs');
const path = require('path');

const _root = path.resolve(__dirname, '../../')

const PROJECTS = {
  frontend: 'sudoku',
  backend: 'api'
}

function build(prj, cb) {
  exec(`nx build ${prj} --prod`, (err, stdout, stderr) => {
    if (!!err) return cb(err);
    cb();
  });
}


/**
 * verifica la presenza dell'intero path, creando i folder che non esistono
 * @param root
 * @param items
 * @returns {*|string}
 */
function checkFolder(root, ...items) {
  const f = path.resolve(root, items.shift());
  if (!fs.existsSync(f)) fs.mkdirSync(f);
  return (items.length > 0) ? checkFolder(f, ...items) : f;
}

/**
 * copia la cartelle e tutto il suo contenuto
 * @param source
 * @param dest
 */
function copyFolder(source, dest) {
  const files = fs.readdirSync(source);
  (files||[]).forEach(pt => {
    const fp = path.resolve(source, pt);
    const dp = path.join(dest, pt)
    const fstat = fs.statSync(fp);
    if (fstat.isFile()) {
      fs.copyFileSync(fp, dp);
      fs.unlinkSync(fp);
    } else if (fstat.isDirectory()) {
      checkFolder(dest, pt);
      copyFolder(fp, dp);
    }
  });
}

function moveFilesTask(source, dest) {
  return function(cb) {
    dest = path.resolve(_root, dest);
    checkFolder('./', ...dest.split('/'));
    source = path.resolve(_root, source);
    // console.log('SOURCE', source, '\n\tDEST', dest);
    copyFolder(source, dest);
    cb();
  };
}

function moveSingleFiles(...pts) {
  return function(cb) {
    pts.forEach(pt => {
      const source = path.resolve(_root, pt[1], pt[0]);
      const dest = path.resolve(_root, pt[2], pt[0]);
      const fstat = fs.statSync(source);
      if (fstat.isFile()) {
        fs.copyFileSync(source, dest);
        fs.unlinkSync(source);
      }
    });
    cb();
  }

}

gulp.task('build-frontend', function(cb) {
  build(PROJECTS.frontend, cb);
});

gulp.task('build-backend', function(cb) {
  build(PROJECTS.backend, cb);
});

gulp.task('compose', moveFilesTask('dist/apps/sudoku/browser', 'dist/apps/api/public'));

gulp.task('move-files', moveSingleFiles(['3rdpartylicenses.txt', 'dist/apps/sudoku', 'dist/apps/api/public']));

gulp.task('end', function(cb) {
  console.log('DONE!');
  cb();
});


gulp.task('deploy', gulp.series(
  'build-frontend',
  'build-backend',
  'compose',
  'move-files'));
