var gulp = require('gulp');
var ts = require('gulp-typescript');

var paths = {
    ts: ['typings/**/*.ts', 'client/**/*.ts', '!**/client/lib/**'],
    templates: ['client/**/*.html', '!**/client/lib/**'],
    styles: ['client/**/*.css', '!**/client/lib/**'],
    lib: ['client/lib/**']
};

gulp.task('ts', function () {
    return gulp.src(paths.ts)
        .pipe(ts({
            'module': 'system',
            'moduleResolution': 'node',
            'experimentalDecorators': true,
            'emitDecoratorMetadata': true,
            'target': 'ES5'
        })).js
        .pipe(gulp.dest('build'));
});

gulp.task('templates', function () {
    return gulp.src(paths.templates)
        .pipe(gulp.dest('build'));
});

gulp.task('styles', function () {
    return gulp.src(paths.styles)
        .pipe(gulp.dest('build'));
});

gulp.task('lib', function () {
    return gulp.src(paths.lib)
        .pipe(gulp.dest('build/lib'));
});

gulp.task('default', ['ts', 'templates', 'styles', 'lib'], function () {
    gulp.watch(paths.ts, ['ts']);
    gulp.watch(paths.templates, ['templates']);
    gulp.watch(paths.styles, ['styles']);
    gulp.watch(paths.lib, ['lib']);
});