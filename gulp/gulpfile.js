var
    _if 			= require('gulp-if'),
    gulp 			= require('gulp'),
    less 			= require('gulp-less'),
    argv 			= require('yargs').argv,
    jade      = require('gulp-jade'),
    csso 			= require('gulp-csso'),
    size 			= require('gulp-size'),
    help 			= require('gulp-help')(gulp),
    watch 		= require('gulp-watch'),
    bower     = require('gulp-bower'),
    uglify 		= require('gulp-uglify'),
    rigger 		= require('gulp-rigger'),
    rename 		= require('gulp-rename'),
    stripD 		= require('gulp-strip-debug'),
    imagemin 	= require('gulp-imagemin'),
    pngquant 	= require('imagemin-pngquant'),
    prefixer 	= require('gulp-autoprefixer'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync');

var _optionsHelp = {
    'mode={p, d}': 'p - production mode, d - development'
}
var _assets = {
    dev: '../app/assets/',
    build: '../dist/assets/'
}
var _paths = {
    build: {
        js: 		_assets.build + 'js/',
        css: 		_assets.build + 'css/',
        img: 		_assets.build + 'img/',
        fonts: 	_assets.build + 'fonts/'
    },
    src: {
        js: 		_assets.dev + 'js/**/*.js',
        css: 		_assets.dev + 'styles/**/*.less',
        img: 		_assets.dev + 'img/**/*',
        fonts: 	_assets.dev + 'fonts/*.*'
    }
}
var	_watch = {
    js: 		[_paths.src.js],
    css: 		[_paths.src.css],
    img: 		[_paths.src.img],
    fonts: 	[_paths.src.fonts]
};
var _init = {
    js: _assets.dev + 'js/App.Init.js',
    css: _assets.dev + 'styles/styles.less',
    jade: '../app/index.jade'
}
gulp.task('bower', 'Install bower packages', function() {
    return bower({ cmd: 'install'});
});

gulp.task('image', 'Copy and optimize images', function () {
    gulp.src(_paths.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(_paths.build.img));
});
gulp.task('copy:font', 'Copy fonts to public dir',  function () {
    return gulp.src(_paths.src.fonts)
        .pipe(gulp.dest(_paths.build.fonts))
        .pipe(size({title: 'copy:font'}));
});

gulp.task('js', 'Compile js files', [], function () {
    return gulp.src(_init.js)
        .pipe(rigger())
        .pipe(_if(argv.mode === 'p', stripD()))
        .pipe(_if(argv.mode === 'p', uglify()))
        .pipe(rename('app.min.js'))
        .pipe(gulp.dest(_paths.build.js))
        .pipe(size({title: 'JS = '}));
}, {
    options: _optionsHelp
});

gulp.task('less', 'Compile less files', [], function () {
    return gulp.src(_init.css)
        .pipe(less())
        .pipe(prefixer('last 1 version'))
        .pipe(_if(argv.mode === 'p', csso()))
        .pipe(rename('styles.min.css'))
        .pipe(gulp.dest(_paths.build.css))
        .pipe(size({title: 'LESS = '}));
}, {
    options: _optionsHelp
});


gulp.task('jade', 'Compile jade templates to html', function() {
    return gulp.src(_init.jade)
        .pipe(jade({
            pretty: false
        }))
        .on('error', console.log)
        .pipe(gulp.dest('../dist/'))
        .pipe(size({title: 'JADE = '}));
});

gulp.task('install', 'Install all packages and compile it', function (cb) {
    argv.mode = 'd';
    runSequence('bower', 'd', cb);
});
/*
 Development mode
 */
gulp.task('d', 'Run tasks in development mode', function (cb) {
    argv.mode = 'd';
    runSequence('image', ['js', 'less','copy:font'], 'jade', cb);
});
/*
Production mode
 */
gulp.task('p', 'Run tasks in production mode', function (cb) {
    argv.mode = 'p';
    runSequence('image', ['js', 'less','copy:font'], 'jade', cb);
});



gulp.task('server', 'Start development server', [], function () {
    browserSync({
        notify: false,
        server: ['../dist']
    });
    gulp.start('d');
    gulp.start('watch');
});
gulp.task('server:after', 'Start development server without pre-compile tasks', [], function () {
    browserSync({
        notify: false,
        server: ['../dist']
    });
    gulp.start('watch');
});
gulp.task('watch', 'Watching task for dirs', [], function () {
    watch(_watch.css, function(event, cb) {
        gulp.start('less');
    });
    watch(_watch.js, function(event, cb) {
        gulp.start('js');
    });
    watch(_watch.img, function(event, cb) {
        gulp.start('image');
    });
    watch(_watch.fonts, function(event, cb) {
        gulp.start('copy:font');
    });

    watch(['../app/index.jade', '../app/assets/templates/*.jade'], function(event, cb) {
        gulp.start('jade');
    });

}, {
    options: _optionsHelp
});