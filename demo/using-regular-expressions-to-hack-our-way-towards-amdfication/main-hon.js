$(function () {

    var originalText = $('#code').val();

    // Codemirror setup
    var myCodeMirror = window.mc = window.CodeMirror.fromTextArea($('#code').get(0), {
        mode: 'javascript',
        theme: 'monokai',
        indentUnit: 4,
        lineNumbers: true,
        gutters: ['CodeMirror-lint-markers'],
        lint: {
            options: window.JSHINT_CONFIG
        }
    });

    // Convert button
    var button = $('#magic');

    /**
     * Define helper, used to generate the define block
     * @type {Object}
     */
    var defineHelper = {
        define_: {},

        /**
         * Adds a dependancy
         * @param {String} path
         * @param {String} value
         */
        add: function (path, value) {
            if (!this.define_[path]) {
                this.define_[path] = [path, value];
            }
        },

        /**
         * Cleans up the define helper
         */
        reset: function () {
            this.define_ = {};
        },

        /**
         * Generates a define block, formatting it and sorting it based on properties
         * @return {String}
         */
        getBlock: function () {
            var defBlock = 'define([';
            var i;

            // Sort all the defines, because why not?
            var defines = _.values(this.define_).sort(function (a, b) {
                if (a[0] < b[0]) {
                    return -1;
                }
                if (a[0] > b[0]) {
                    return 1;
                }
                return 0;
            });

            // Add the indented define paths
            var spaces = '';
            for (i = 0; i < defines.length; i++) {
                defBlock += spaces + "'" + defines[i][0] + "',\n";

                if (i === 0) {
                    spaces = '        ';
                }
            }

            // Add the define function block
            defBlock = defBlock.slice(0, -2) + '],\n\nfunction (';

            for (i = 0; i < defines.length; i++) {
                defBlock += "" + defines[i][1] + ", ";
            }

            defBlock = defBlock.slice(0, -2) + ') {\n\n';

            return defBlock;
        }
    };

    var prepends = [];
    var magicRules = [

        // Basic search replace
        ['var Badoo = Badoo || {};', ''],
        ['})(Badoo, Zepto);', '});'],
        ['}(Badoo, $));', '});'],
        ['})(Badoo);', '});'],
        ['(function (B) {', ''],
        ['(function (B, $) {', ''],

        [/Badoo\./g, 'B.'],

        // underscore.
        [/( |\()_\./g,
            function (str, match) {
                defineHelper.add('underscore', '_');
                return match + '_.';
            }
        ],

        // Zepto
        [/([^\.])\$(\(|\.)/g,
            function (str, pre, post) {
                defineHelper.add('zepto', '$');
                return pre + '$' + post;
            }
        ],

        // Definition
        [/B(adoo)?\.(View|Model|Controller)s\.(\w+)( )?=/g,
            function (str, meh, type, file) {
                return 'var ' + file + ' =';
            }
        ],

        // MVC
        [/B(adoo)?\.(View|Model|Controller)s\.(\w+)/g,
            function (str, meh, type, file) {
                defineHelper.add(type + 's/' + file, file.indexOf(type) === -1 ? file + type : file);
                return file.indexOf(type) === -1 ? file + type : file;
            }
        ],

        // Proto
        [/B(adoo)?\.Proto\.(\w+)/g,
            function (str, meh, file) {
                defineHelper.add('Proto/' + file, file + 'Proto');
                return file + 'Proto';
            }
        ],

        // Util
        [/B(adoo)?\.Utils\.(\w+)/g,
            function (str, meh, file) {
                defineHelper.add('Utils/' + file, file);
                return file;
            }
        ],

        // Config
        [/B(adoo)?\.config/g,
            function () {
                defineHelper.add('config', 'config');
                return 'config';
            }
        ],

        // Translations
        [/_t\./g,
            function () {
                defineHelper.add('Utils/LexumManager', 'Lexums');
                prepends.push('    var _t = Lexums.get();');
                return '_t.';
            }
        ],

        // Core stuff
        [/B\.(View|UI|Session|Router|Model|History|GlobalEvents|Events|Controller|Api)/g,
            function (str, match) {
                defineHelper.add('Core/' + match, match);
                return match;
            }
        ]
    ];

    button.on('click', function () {
        var val = myCodeMirror.getValue();
        var i;

        // Reset the defines
        defineHelper.reset();
        prepends.length = 0;

        // Run all the rules on the code
        for (i = 0; i < magicRules.length; i++) {
            val = val.replace(magicRules[i][0], magicRules[i][1]);
        }

        val = '    ' + val.trim();

        myCodeMirror.setValue(defineHelper.getBlock() + _.uniq(prepends).join('\n') + val);
    });

    $('#revert').on('click', function () {
        myCodeMirror.setValue(originalText);
    });

});