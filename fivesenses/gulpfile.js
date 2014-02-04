var gulp = require('gulp');
var gutil = require('gulp-util');
var jade = require('gulp-jade');
var stylus = require('gulp-stylus');

var paths = {
  templates: ['templates/*.jade'],
  styles: ['styles/*.styl'],
};

gulp.task('templates', function(){
  return gulp.src(paths.templates)
    .pipe(jade())
    .pipe(gulp.dest(''))
});

gulp.task('styles', function(){
  return gulp.src(paths.styles)
    .pipe(stylus())
    .pipe(gulp.dest('css/'))
});

gulp.task('watch', function () {
  gulp.watch(paths.templates, ['templates']);
  gulp.watch(paths.styles, ['styles']);
});


gulp.task('default', ['templates', 'styles', 'watch']);