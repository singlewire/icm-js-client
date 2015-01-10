var gulp = require('gulp');
var coffee = require('gulp-coffee');

gulp.task('default', function () {
    return gulp.src('src/**/*.coffee')
        .pipe(coffee({bare: true}))
        .pipe(gulp.dest('dist'));
});
