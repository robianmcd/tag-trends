var gulp = require('gulp');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');
var rev = require('gulp-rev');
var inject = require('gulp-inject');
var rimraf = require('gulp-rimraf');

var paths = {
    //Paths to source code
    src: {
        app: {
            scripts: ['typings/**/*.ts', 'client/**/*.ts', '!**/client/lib/**'],
            styles: ['client/**/*.css', '!**/client/lib/**']
        },
        vendor: {
            dev: {
                scripts: [
                    'node_modules/systemjs/dist/system.src.js',
                    'client/lib/systemConfig.js',
                    'node_modules/angular2/bundles/angular2.dev.js',
                    'node_modules/moment/moment.js',
                    'node_modules/rx/dist/rx.lite.js',
                    'client/lib/fetch-0.9.0/fetch.js',
                    'client/lib/awesomplete/awesomplete.js', //TODO: use npm
                    'client/lib/c3/d3.v3.min.js', //TODO: use npm
                    'client/lib/c3/c3.js' //TODO: use npm
                ],
                styles: [
                    'node_modules/bootstrap/dist/css/bootstrap.css',
                    'client/lib/awesomplete/awesomplete.css', //TODO: use npm
                    'client/lib/c3/c3.min.css' //TODO: use npm
                ]
            },
            prod: {
                scripts: [
                    'node_modules/systemjs/dist/system.js',
                    'client/lib/systemConfig.js',
                    'node_modules/angular2/bundles/angular2.min.js',
                    'node_modules/moment/min/moment.min.js',
                    'node_modules/rx/dist/rx.lite.min.js',
                    'client/lib/fetch-0.9.0/fetch.min.js',
                    'client/lib/awesomplete/awesomplete.js', //TODO: minify. or use npm
                    'client/lib/c3/d3.v3.min.js', //TODO: use npm
                    'client/lib/c3/c3.min.js' //TODO: try to use npm
                ],
                styles: [
                    'node_modules/bootstrap/dist/css/bootstrap.min.css',
                    'client/lib/awesomplete/awesomplete.css', //TODO: use npm
                    'client/lib/c3/c3.min.css' //TODO: use npm
                ]
            }

        }
    },
    //Paths files in the build folder
    //TODO: try using gulp src base instead of making these relative to the build folder
    devDist: {
        base: 'build',
        app: {
            scripts: ['**/*.js', '!vendor/**'],
            styles: ['**/*.css', '!vendor/**']
        },
        vendor: {
            scripts: ['vendor/**/*.js'],
            styles: ['vendor/**/*.css']
        },
        inject: [
            'vendor/**/*.js',
            'vendor/**/*.css',
            '**/*.css'
        ]
    },
    //Paths to files in the build-prod folder
    prodDist: {
        base: 'build-prod',
        app: {
            scripts: ['app*.js'],
            styles: ['app*.css']
        },
        vendor: {
            scripts: ['vendor*.js'],
            styles: ['vendor*.css']
        }
    }
};

function clean(path) {
    return gulp.src(path)
        .pipe(rimraf());
}

gulp.task('clean-app-scripts', function () {
    return clean(paths.devDist.base + '/' + paths.devDist.app.scripts);
});

gulp.task('app-scripts', ['clean-app-scripts'], function () {
    return gulp.src(paths.src.app.scripts)
        .pipe(ts({
            module: 'system',
            moduleResolution: 'node',
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            target: 'ES5'
        })).js
        //.pipe(rev())
        .pipe(gulp.dest(paths.devDist.base));
});

gulp.task('clean-app-styles', function () {
    return clean(paths.devDist.base + '/' + paths.devDist.app.styles);
});

gulp.task('app-styles', ['clean-app-styles'], function () {
    return gulp.src(paths.src.app.styles)
        .pipe(rev())
        .pipe(gulp.dest(paths.devDist.base));
});

gulp.task('clean-vendor-scripts', function () {
    return clean(paths.devDist.base + '/' + paths.devDist.vendor.scripts);
});

gulp.task('vendor-scripts', ['clean-vendor-scripts'], function () {
    return gulp.src(paths.src.vendor.dev.scripts)
        .pipe(concat('vendor.js')) //TODO get this working without concat. inject needs to inject in the right order.
        .pipe(rev())
        .pipe(gulp.dest('build/vendor'));
});

gulp.task('clean-vendor-styles', function () {
    return clean(paths.devDist.base + '/' + paths.devDist.vendor.styles);
});

gulp.task('vendor-styles', ['clean-vendor-styles'], function () {
    return gulp.src(paths.src.vendor.dev.styles)
        .pipe(gulp.dest('build/vendor'));
});

gulp.task('index', ['app-styles', 'vendor-scripts', 'vendor-styles'], function () {
    var cssAndJsPath = [].concat(
        paths.devDist.vendor.scripts,
        paths.devDist.vendor.styles,
        paths.devDist.app.scripts,
        paths.devDist.app.styles
    );
    var src = gulp.src(paths.devDist.inject, {read: false, cwd: paths.devDist.base});
    return gulp.src('client/index.html')
        .pipe(inject(src, {addRootSlash: false}))
        .pipe(gulp.dest('build'));
});

gulp.task('default', ['index', 'app-scripts'], function () {
    gulp.watch(paths.src.app.scripts, ['app-scripts']);
    gulp.watch(paths.src.app.styles, ['index']);
    gulp.watch(paths.src.vendor.scripts, ['index']);
    gulp.watch(paths.src.vendor.styles, ['index']);
});