var gulp = require('gulp');
var sass = require('gulp-sass');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var eslint = require('gulp-eslint');
var rename = require('gulp-rename');
var header = require('gulp-header');
var templateCache = require('gulp-angular-templatecache');
var minifyHtml = require('gulp-minify-html');
var concat = require('gulp-concat');
var addsrc = require('gulp-add-src');
var order = require('gulp-order');
var packageName = 'slide';
var del = require('del');

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @author <%= pkg.author %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');

 // ==== Styles
gulp.task('styles', function () {
  gulp.src('src/*.scss')
     .pipe(header(banner, { pkg: pkg }))
     .pipe(rename({
       basename: packageName
     }))
     .pipe(gulp.dest('dist'))
     .pipe(sass().on('error', sass.logError))
     .pipe(rename({
       suffix: '.min'
     }))
     .pipe(gulp.dest('dist'))
     .pipe(gulp.dest('demo'));
});

// ====== Templates
gulp.task('templates', function () {
  gulp.src(['*.html'], { cwd: 'src' })
   .pipe(minifyHtml({
     empty: true,
     spare: true,
     quotes: true
   }))
   .pipe(templateCache({
     module: packageName
   }))
   .pipe(rename([packageName, '.templates.js'].join('')))
   .pipe(gulp.dest('build'));
});

gulp.task('service', function () {
  gulp.src(['src/*.js'])
   .pipe(eslint())
   .pipe(eslint.format())
   .pipe(eslint.failAfterError())
   .pipe(ngAnnotate())
   .pipe(addsrc('build/*.js'))
   .pipe(order([
     'src/*.js',
     'build/slide.templates.js'
   ], { base: './' }))
   .pipe(concat([packageName, '.js'].join('')))

   .pipe(header(banner, { pkg: pkg }))
   .pipe(gulp.dest('dist'))

   .pipe(uglify())
   .pipe(rename({
     suffix: '.min'
   }))
   .pipe(header(banner, { pkg: pkg }))
   .pipe(gulp.dest('dist'))
   .pipe(gulp.dest('demo'));
});

gulp.task('clean', function () {
  return del([
    'dist/',
    'build',
    'demo/slide.min.js'
  ]);
});

gulp.task('build', ['clean', 'templates', 'service', 'styles']);
gulp.task('default', ['build'], function () {});
