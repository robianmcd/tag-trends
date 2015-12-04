var gulp = require('gulp');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');
var rev = require('gulp-rev');
var inject = require('gulp-inject');
var rimraf = require('gulp-rimraf');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');

var paths = {
    //Paths to source code
    src: {
        app: {
            scripts: ['typings/**/*.ts', 'client/**/*.ts', '!**/client/lib/**'],
            styles: ['client/**/*.css', '!**/client/lib/**'],
            images: ['client/**/*.ico', 'client/**/*.png', 'client/**/*.gif', '!**/client/lib/**']
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
    //TODO: try using gulp src base instead of making these relative to the build folder
    dist: {
        devBase: 'build',
        prodBase: 'build-prod',
        app: {
            scripts: ['**/*.js', '!vendor/**'],
            styles: ['**/*.css', '!vendor/**'],
            images: ['**/*.ico', '**/*.png', '**/*.gif', '!vendor/**']
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
    }
};

function clean(cwd, path) {
    return gulp.src(path, {read: false, cwd: cwd})
        .pipe(rimraf());
}

function appScripts(src) {
    return gulp.src(src)
        .pipe(ts({
            module: 'system',
            moduleResolution: 'node',
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            target: 'ES5'
        })).js
}

function buildIndex(distBase) {
    var src = gulp.src(paths.dist.inject, {read: false, cwd: distBase});
    return gulp.src('client/index.html')
        .pipe(inject(src, {addRootSlash: false}))
        .pipe(gulp.dest(distBase));
}

gulp.task('clean-app-scripts', function () {
    return clean(paths.dist.devBase, paths.dist.app.scripts);
});

gulp.task('app-scripts', ['clean-app-scripts'], function () {
    return appScripts(paths.src.app.scripts)
        .pipe(gulp.dest(paths.dist.devBase));
});

gulp.task('clean-app-scripts-prod', function () {
    return clean(paths.dist.prodBase, paths.dist.app.scripts);
});

gulp.task('app-scripts-prod', ['clean-app-scripts-prod'], function () {
    return appScripts(paths.src.app.scripts)
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist.prodBase));
});

gulp.task('clean-app-styles', function () {
    return clean(paths.dist.devBase, paths.dist.app.styles);
});

gulp.task('app-styles', ['clean-app-styles'], function () {
    return gulp.src(paths.src.app.styles)
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.devBase));
});

gulp.task('clean-app-styles-prod', function () {
    return clean(paths.dist.prodBase, paths.dist.app.styles);
});

gulp.task('app-styles-prod', ['clean-app-styles-prod'], function () {
    return gulp.src(paths.src.app.styles)
        .pipe(concat('app.css'))
        .pipe(minifyCss())
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.prodBase));
});

gulp.task('clean-vendor-scripts', function () {
    return clean(paths.dist.devBase, paths.dist.vendor.scripts);
});

gulp.task('vendor-scripts', ['clean-vendor-scripts'], function () {
    return gulp.src(paths.src.vendor.dev.scripts)
        .pipe(concat('vendor.js')) //TODO get this working without concat. inject needs to inject in the right order.
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.devBase + '/vendor'));
});

gulp.task('clean-vendor-scripts-prod', function () {
    return clean(paths.dist.prodBase, paths.dist.vendor.scripts);
});

gulp.task('vendor-scripts-prod', ['clean-vendor-scripts-prod'], function () {
    return gulp.src(paths.src.vendor.prod.scripts)
        .pipe(concat('vendor.js'))
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.prodBase + '/vendor'));
});

gulp.task('clean-vendor-styles', function () {
    return clean(paths.dist.devBase, paths.dist.vendor.styles);
});

gulp.task('vendor-styles', ['clean-vendor-styles'], function () {
    return gulp.src(paths.src.vendor.dev.styles)
        .pipe(gulp.dest(paths.dist.devBase + '/vendor'));
});

gulp.task('clean-vendor-styles-prod', function () {
    return clean(paths.dist.prodBase, paths.dist.vendor.styles);
});

gulp.task('vendor-styles-prod', ['clean-vendor-styles-prod'], function () {
    return gulp.src(paths.src.vendor.prod.styles)
        .pipe(concat('vendor.css'))
        .pipe(minifyCss())
        .pipe(rev())
        .pipe(gulp.dest(paths.dist.prodBase + '/vendor'));
});

gulp.task('clean-app-images', function() {
    return clean(paths.dist.devBase, paths.dist.app.images);
});

gulp.task('app-images', ['clean-app-images'], function() {
    return gulp.src(paths.src.app.images)
        .pipe(gulp.dest(paths.dist.devBase));
});

gulp.task('clean-app-images-prod', function() {
    return clean(paths.dist.prodBase, paths.dist.app.images);
});

gulp.task('app-images-prod', ['clean-app-images-prod'], function() {
    return gulp.src(paths.src.app.images)
        .pipe(gulp.dest(paths.dist.prodBase));
});

gulp.task('index', ['app-styles', 'vendor-scripts', 'vendor-styles'], function () {
    return buildIndex(paths.dist.devBase);
});

gulp.task('index-prod', ['app-styles-prod', 'vendor-scripts-prod', 'vendor-styles-prod'], function () {
    return buildIndex(paths.dist.prodBase);
});

gulp.task('default', ['index', 'app-scripts', 'app-images'], function () {
    gulp.watch(paths.src.app.scripts, ['app-scripts']);
    gulp.watch(paths.src.app.images, ['app-images']);
    gulp.watch(paths.src.app.styles, ['index']);
    gulp.watch(paths.src.vendor.scripts, ['index']);
    gulp.watch(paths.src.vendor.styles, ['index']);
    gulp.watch('client/index.html', ['index']);
});

gulp.task('build', ['index', 'app-scripts', 'app-images']);
gulp.task('build-prod', ['index-prod', 'app-scripts-prod', 'app-images-prod']);