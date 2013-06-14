
module.exports = function(grunt) {
  'use strict';

  var config, debug, environment, spec;
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-templater');
  grunt.loadNpmTasks('rally-app-builder');

  grunt.registerTask('default', ['clean', 'concat', 'template']);
  grunt.registerTask('test', ['default', 'coffee', 'jasmine']);
  grunt.registerTask('build', ['concat', 'template:build']);
  grunt.registerTask('deploy', ['build', 'rallydeploy:prod']);

  spec = grunt.option('spec') || '*';
  config = grunt.file.readJSON('config.json');

  return grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    clean: [ 'gen/**/*', 'test/*Spec.js' ],

    concat: {
      src: {
        src: 'src/**/*.js',
        dest: 'gen/all.js'
      },
      styles: {
        src: 'styles/**/*.css',
        dest: 'gen/all.css'
      }
    },

    jasmine: {
      dev: {
        src: "src/*.js",
        options: {
          template: 'test/specs.tmpl',
          specs: "test/**/" + spec + "Spec.js",
          helpers: ['test/**/helpers/**/*.js']
        }
      }
    },

    coffee: {
      test: {
        expand: true,
        cwd: 'test',
        src: ['*.coffee'],
        dest: 'test',
        ext: '.js'
      },
      src: {
        expand: true,
        cwd: 'src',
        src: ['*.coffee'],
        dest: 'src',
        ext: '.js'
      }
    },

    watch: {
      coffee: {
        files: '{src,test}/**/*.coffee',
        tasks: 'coffee'
      },
      src: {
        files: 'src/**/*.js',
        tasks: ['template:debug', 'clean', 'concat', 'template:build']
      },
      config: {
        files: 'config.json',
        tasks: ['template']
      },
      build: {
        files: 'config.json',
        tasks: ['template:build']
      },
      template: {
        files: 'templates/**/*',
        tasks: ['template']
      }
    },

    template: {
      debug: {
        src: 'templates/App-debug.html',
        dest: 'App-debug.html',
        engine: 'handlebars',
        variables: config
      },
      jasmine_template: {
        src: 'templates/specs.tmpl',
        dest: 'test/specs.tmpl',
        engine: 'handlebars',
        variables: config
      },
      build: {
        src: 'templates/App.html',
        dest: 'deploy/App.html',
        engine: 'handlebars',
        variables: function() {
          config.javascript = grunt.file.read('gen/all.js');
          config.css = grunt.file.read('gen/all.css');
          return config;
        }
      }
    },

    rallytestrunner: {
      options: {
        browserName: 'phantomjs'
      }
    },

    rallydeploy: {
      options: {
        server: "rally1.rallydev.com",
        projectOid: 1971104447,
        deployFile: "deploy.json",
        credentialsFile: "credentials.json"
      },
      prod: {
        options: {
          tab: "myhome",
          pageName: "App Name",
          shared: false
        }
      }
    }
  });
};
