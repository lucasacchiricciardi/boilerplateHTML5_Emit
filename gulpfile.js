// *** dependencies *** //
const argv = require('minimist')(process.argv.slice(2));

const gulp = require('gulp');
const {
  src, series, parallel, dest, watch,
} = require('gulp');
const imagemin = require('gulp-imagemin');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const gulpif = require('gulp-if');
const notify = require('gulp-notify');

const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const jshint = require('gulp-jshint');
const jscs = require('gulp-jscs');
const runSequence = require('run-sequence');

// CLI options
const enabled = {
  // Enable static asset revisioning when `--production`
  rev: argv.production,
  // Disable source maps when `--production`
  maps: !argv.production,
  // Fail due to JSHint warnings only when `--production`
  failJSHint: argv.production,
  // Strip debug statments from javascript when `--production`
  stripJSDebug: argv.production,
  compression: argv.production
};


const jsPath = 'src/**/*.js';
const cssPath = 'src/assets/css/**/*.css';
const htmlPath = 'src/**/*.html';
// *** tasks *** ///

function jsHint(){
  return src(jsPath)
    .pipe(jshint({
      esnext: true
    }))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
};

function style() {
  return src(jsPath)
    .pipe(jscs())
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'));
};


function copyHTML() {
  return src('src/*.html').pipe(gulp.dest('dist'));
}

function imgTask() {
  return src('src/images/*').pipe(imagemin()).pipe(gulp.dest('dist/images'));
}

function jsTask() {
  return src(jsPath)
    .pipe(sourcemaps.init())
    .pipe(concat('all.js'))
    .pipe(jshint())
        .on('error', notify.onError())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(gulpif(enabled.failJSHint, jshint.reporter('fail')))
    .pipe(terser())
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist/assets/js'));
}

function cssTask() {
  return src(cssPath)
    .pipe(sourcemaps.init())
    .pipe(concat('style.css'))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('dist/assets/css'));
}

function watchTask() {
 // watch([cssPath, jsPath, htmlPath], { interval: 1000 }, parallel(copyHTML, cssTask, jsTask));

  watch([jsPath,htmlPath,cssPath],{interval: 1000}, parallel(
    'jsHint',
    'style'
  ));
};

exports.copyHTML = copyHTML;
exports.imgTask = imgTask;
exports.jsTask = jsTask;
exports.cssTask = cssTask;
exports.jsHint = jsHint;
exports.style = style;
exports.watchTask = watchTask;

// *** defailt task *** //
//exports.default = series(jsHint,style,watchTask)
exports.default = series(parallel(copyHTML, imgTask, jsTask, cssTask ,jsHint,style), watchTask);
