﻿var gulp = require('gulp');
var concat = require('gulp-concat');
var typescript = require('gulp-typescript');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sassGlob = require('gulp-sass-glob');
var inlineNg2Template = require('gulp-inline-ng2-template');
var htmlMinifier = require('html-minifier');
var merge = require('merge2');
var webserver = require('gulp-webserver');
var Builder = require('systemjs-builder');
var runSequence = require('run-sequence');
var server = require('gulp-server-livereload');
var minCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var pkg = require('./package.json');
var name = pkg.name;
var path = require('path');

var paths = {
    source: 'src',
    dest: 'lib',
    bundle: 'bundles',
    esm: 'esm',
    work: 'compile'
};


function minifyTemplate(path, ext, file, cb) {
  try {
    var minifiedFile = htmlMinifier.minify(file, {
      collapseWhitespace: true,
      caseSensitive: true,
      removeComments: true,
      removeRedundantAttributes: true
    });
    cb(null, minifiedFile);
  }
  catch (err) {
    cb(err);
  }
}

var inlineTemplateConfig = {
    base: paths.dest,
    html: true,
    css: true,
    target: 'es5',
    indent: 2,
    useRelativePaths: true,
    templateProcessor: minifyTemplate
}


gulp.task('hello', function () {
    console.log('HELLO!');
    console.log(Object.keys(gulp.tasks));
});

gulp.task('cleanSass', function () {
    return gulp.src(paths.dest + '/**/*.css', { read: false })
			.pipe(vinylPaths(del));
});

gulp.task('cleanViews', function () {
    return gulp.src(paths.dest + '/**/*.html', { read: false })
			.pipe(vinylPaths(del));
});

gulp.task('cleanScripts', function () {
    return gulp.src(paths.dest + '/**/*.{js,map,d.ts}', { read: false })
			.pipe(vinylPaths(del));
});

gulp.task("cleanEs6", function() {
    return gulp.src(paths.dest + '/**/*.{js,map,d.ts}', { read: false })
			.pipe(vinylPaths(del));
});

gulp.task("cleanPrep", function() {
    return merge([
        gulp.src(paths.work + '/**/*.*', { read: false })
			.pipe(vinylPaths(del))
    ]);
})

gulp.task("prep", ["cleanPrep"], function() {
    return merge([
        gulp.src([paths.source + '/**/*.*', '!'+paths.source + '/**/*.css'])
            .pipe(gulp.dest(paths.work))
    ]);
})

gulp.task('clean', ['cleanSass','cleanViews', 'cleanScripts', 'cleanEs6']);

gulp.task('views', ['cleanViews'], function () {
    return gulp.src(paths.source + '/**/*.html')
        .pipe(gulp.dest(paths.dest));
});

gulp.task('sass', ['cleanSass', 'prep'], function () {
    return gulp.src(paths.work + '/**/*.{scss,sass}')
        //.pipe(sourcemaps.init())
        .pipe(sassGlob())
        .pipe(sass({
            errLogToConsole: true
        }).on('error', sass.logError))
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.work))
        .pipe(gulp.dest(paths.dest));

});

gulp.task('scripts', ['cleanScripts', 'views', 'sass', 'prep'], function () {
    var tsProject = typescript.createProject('tsconfig.json');
    
    var sourceFiles = [
        paths.work + '/**/*.ts',
        './typings/index.d.ts',
        //'!./node_modules/angular2/typings/es6-collections/es6-collections.d.ts',
        //'!./node_modules/angular2/typings/es6-promise/es6-promise.d.ts'
    ];

    var tsResult = gulp
        .src(sourceFiles)
        .pipe(inlineNg2Template(inlineTemplateConfig))
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject));
        
    //copy NoUiSlider to lib for demo
    var noUiSlider = gulp
        .src('./src/**/NoUiSlider.js')
        .pipe(rename({dirname: 'components/Slider'}))
        .pipe(gulp.dest(paths.dest));

    return merge(
        [
            tsResult.js
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest(paths.dest)),
            tsResult.dts
                .pipe(gulp.dest(paths.dest))
        ]);
});

gulp.task('es6', ['views', 'sass', 'cleanEs6', 'scripts', 'prep'], function () {
    var tsProject = typescript.createProject('tsconfig.es6.json');
    
    var sourceFiles = [
        paths.work + '/**/*.ts'
    ];

    var tsResult = gulp
        .src(sourceFiles)
        .pipe(inlineNg2Template(inlineTemplateConfig))
        .pipe(typescript(tsProject));
        
    //copy NoUiSlider to lib for demo
    var noUiSlider = gulp
        .src('./src/**/NoUiSlider.js')
        .pipe(rename({dirname: 'components/Slider'}))
        .pipe(gulp.dest(paths.esm));

    return merge(
        [
            tsResult.js
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest(paths.esm)),
            tsResult.dts
                .pipe(gulp.dest(paths.esm))
        ]);
});

gulp.task('bundle', function(){
    runSequence(
        'bundleScripts',
        'bundleSass'
    );
})

gulp.task('bundleScripts', ['scripts'], function() { 
    var builder = new Builder();
    var config = {
        baseURL: '..',
        transpiler: 'typescript',
        typescriptOptions: {
            module: 'cjs'
        },
        map: {
            typescript: 'fuel-ui/node_modules/typescript/lib/typescript.js',
            '@angular': 'fuel-ui/node_modules/@angular',
            rxjs: 'fuel-ui/node_modules/rxjs'
        },
        paths: {
            '*': '*.js'
        },
        meta: {
            'fuel-ui/node_modules/@angular/*': { build: false },
            'fuel-ui/node_modules/rxjs/*': { build: false }
        }
    };

    builder.config(config);

    return builder.bundle(name+'/'+paths.dest+'/'+name, paths.bundle+'/fuel-ui.js')
        .then(function() {
            console.log('Build complete.');
            return builder.bundle(name+'/'+paths.dest+'/'+name, paths.bundle+'/fuel-ui.min.js', {minify: true, mangle: false})
                .then(function() {
                    console.log('Minified build complete.');
                })
                .catch(function(err) {
                    console.log('Minification error', err);
                });
        })
        .catch(function(err) {
            console.log('Error', err);
        });
});

gulp.task('bundleSass', ['sass'], function(){
    gulp.src(paths.dest + '/styles/fuel-ui.css')
        .pipe(gulp.dest(paths.bundle))
        .pipe(minCss())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(paths.bundle));
});

gulp.task('serve', function(){
	gulp.src('./')
		.pipe(server({
			livereload: {
				enable: true,
                port: 35728,
				filter: function(filePath, cb) {
					cb( 
						/dist\/[^\/]*\.js$/.test(filePath) &&
						!(/node_modules/.test(filePath)) &&  
						!(/.*ts$/.test(filePath)) && 
						!(/gulpfile.js$/.test(filePath))
					);
				}
			},
			defaultFile: 'index.html',
			open: true,
            port: 8001
		}));
});

gulp.task('watch', function () {
    gulp.watch(paths.source+'/**/*.*', ['scripts']);
});

gulp.task('postBuild', ['sass', 'scripts', 'es6'] , function() {
    //return merge([
    //    gulp.src(paths.source + '/**/*.css', { read: false })
    //        .pipe(vinylPaths(del))
    //]);
});

gulp.task('build', ['prep', 'sass', 'views', 'scripts', 'es6', 'bundle', 'postBuild']);

gulp.task('default', function(){
	runSequence(
		'build',
		'serve',
		'watch'
	);
});
