var exec         = require('child_process').exec,
    del          = require('del'),
    gulp         = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    concat       = require('gulp-concat'),
    imagemin     = require('gulp-imagemin'),
    jshint       = require('gulp-jshint'),
    livereload   = require('gulp-livereload'),
    notify       = require('gulp-notify'),
    sass         = require('gulp-sass'),
    svgstore     = require('gulp-svgstore'),
    inject       = require('gulp-inject');

// Folders
var path = {
  src: "src",
  build: "www"
};

// Error Handling
function handleError( error ) {
  console.log( error.toString() );
  this.emit( 'end' ); // Needsthis so it doesn't fall over
}

// Clean - removes the build directory
gulp.task('clean', function() {
  del([ path.build ], {
    force: true
  });
});

// Copy - copies nominated files to the build directory
gulp.task('copy', ['svgstore'], function() {
  return gulp.src([ path.src + '/fonts/**/*', path.src + '/views/**/*' ], { base: path.src })
    .pipe( gulp.dest( path.build ) )
    .pipe( notify({ message: 'Copy task complete', onLast: true }) );
});

// Images - minifies images and moves them to the build directory
gulp.task('images', function() {
  return gulp.src([ path.src + '/img/**/*' ])
    .pipe( imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }]
    }) )
    .pipe( gulp.dest( path.build + '/img' ) )
    .pipe( notify({ message: 'Images task complete', onLast: true }) );
});

// JSHint - validates custom javascript (i.e. not vendor scripts)
gulp.task('jshint', function() {
  gulp.src([ path.src + '/js/**/*.js' ])
    .pipe( jshint({
        sub: true,
        undef: false, // Stops '[object] is not defined' errors
        unused: false // Stops '[object] is defined but never used' errors
      })
    )
    .pipe( jshint.reporter('default') );
});

// Styles - compiles the SASS files into one CSS file
gulp.task('styles', function() {
  return gulp.src([ path.src + '/scss/**/*.scss' ])
    .pipe( sass() )
    .pipe( autoprefixer({ browsers: 'iOS >= 8, Android >= 4.4' }) )
    .pipe( gulp.dest(path.build + '/css') )
    .pipe( notify({ message: 'Styles task complete' }) )
    .pipe( livereload() )
    .on( 'error', handleError );
});

// SVG - Inline icons into the body
gulp.task('svgstore', function () {
  var svgs = gulp
    .src( [ path.src + '/img/icons/**/*.svg' ] )
    .pipe(svgstore({ inlineSvg: true }));

  function fileContents (filePath, file) {
    return file.contents.toString();
  }

  return gulp
    .src( [ path.src + '/index.html' ] )
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe( gulp.dest( path.build ) )
});

// Create the kss templates and then inject the SVG code
gulp.task('kss', ['generate-kss-templates'], function () {
  var svgs = gulp
    .src( [ path.src + '/img/icons/**/*.svg' ] )
    .pipe(svgstore({ inlineSvg: true }));

  function fileContents (filePath, file) {
    return file.contents.toString();
  }

  return gulp
    .src( [ path.build + '/styleguide/*.html' ] )
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe( gulp.dest( path.build + '/styleguide' ) )
});

// KSS Styleguide
gulp.task('generate-kss-templates', function( cb ) {
  // see package.json
  exec('npm run build-kss', function ( error, stdout, stderr ) {
    if ( !!error ) { console.error( error ); }
    if ( !!stdout ) { console.info( stdout ); }
    if ( !!stderr ) { console.info( stderr ); }
    if ( !!cb ) { cb(); }
  });

});

// Default
gulp.task('default', ['images','styles','copy', 'kss']);

// Watch
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch([ path.src + '/img/**/*'], ['images']);
  gulp.watch([ path.src + '/scss/**/*.scss'], ['styles']);
  gulp.watch([ path.src + '/index.html', path.src + '/fonts/**/*', path.src + '/views/**/*'], ['copy']);
});
