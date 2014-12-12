---
layout: post
title:  Using regular expressions to hack our way towards AMDfication
author: Nikhil Verma
date:   2014-10-16
categories: javascript web
---

Badoo’s MobileWeb project started in early 2012. Due to the initial pace of development, coding conventions and modularisation weren’t given priority. Most of the ‘modules’ lived inside a global object. As the project grew it became difficult to maintain and bugs became harder to track down. So after much internal discussion we found an opportunity to convert our codebase to use AMD modules ([RequireJS](http://requirejs.org/docs/whyamd.html)). I’m here to explain how we used the power of regular expressions to speed up our migration process.

# The Problem

Below is a snippet of the kind of code we were working with.

{% highlight javascript %}
var Badoo = Badoo || {};

(function (B) {
    // Local references to other modules and their properties
    var Session = B.Session;
    var History = B.History;
    var AppView = B.Views.App;
    var MESSAGES_FOLDER =  B.Models.Folders.TYPES.MESSAGES;

    // App controller initialization
    var App = B.Controllers.App = Badoo.Controller.extend({
        init: function () {
            // Initialize some views and controllers
            var controller = new B.Controllers.Landing();
            var view = new B.Views.Alert();

            // Write some cookies
            Badoo.Utils.Cookie.set('test', 1000 * 42);
        }
    });

    // Make it instanceable
    var instance;
    App.getInstance = function () {
        return instance || (instance = new App('app'));
    };

    return App;

})(Badoo);
{% endhighlight %}

As you can see, everything was ‘global’, called directly and had no tracking of dependencies. Fortunately, we had a couple of good things going for us:

1. The project structure was modular (e.g `B.Views.Alert` was inside `Views/Alert`)
2. In most cases each file corresponded with its object name.

# Manual Attempts

Initially we attempted to do this manually, but this had the following drawbacks:

1. **Merge Conflicts** - We can’t stop adding features to the original project, so merge conflicts every time there is an update.
2. **Bugs** - The process was error prone. Humans are bad at repetitive tasks and we often missed objects or made typos which made debugging frustrating, because a huge chunk of the project needed to be converted before we could boot up the app.
3. **Time** - It took us time to convert each file, and we had 400+ files to do.

I realised that this is something that must be automated. First I tried to experiment with [Esprima](http://esprima.org/), but that turned out to be time-consuming and reminded me of this XKCD comic:

[![XKCD](http://imgs.xkcd.com/comics/is_it_worth_the_time.png)](http://xkcd.com/1205/)

What I needed was a quick solution that semi-automated the process.

# Enter Regex

Because most of our project followed predictable conventions, I could try implementing something which matches those patterns and generates AMDfied versions. One of the really cool features in JavaScript is that you can pass methods to Regex replace functions.

{% highlight javascript %}
var sentence = 'I like turtles';
var wordCount = 0;

console.log(sentence.replace(/\w+/gi, function (word) {
    return word + ':' + ++wordCount;
}));

// Output: I:1 like:2 turtles:3
{% endhighlight %}

So I set out to make a tool which does the following:

1. Uses [CodeMirror](http://codemirror.net/) as the editor.
2. Auto-AMDfies the project and lets us know of any errors using JSHint.
3. Requires minors tweaks to get the pasteable result.

# The Solution

And I’m happy to present the solution!

<iframe style="border: 0; width: 100%; min-height: 600px;" src="{{page.demodir}}/index.html"></iframe>

When you press ‘Convert’, it reads the contents of the file, applies the JavaScript below and writes the result. It does leave some code that needs to be removed manually. I could have fixed that as well, but remembering the XKCD chart I decided it’s faster to delete those bits by hand than remove them via code.

> **Note:** <a href="{{page.demodir}}/index.html">If the demo doesn’t work you can visit it by clicking me.</a>

# Breakdown of the solution

First we need to have a method which lets us generate `define()` blocks, given the dependencies.

{% highlight javascript %}
/**
 * Generates a define block, formatting it and sorting it based on properties
 * @return {String}
 */
getBlock: function () {
    var defBlock = 'define([';
    var i;

    // Sort all the defines, because why not?
    // this.define_ is a path:name mapping
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

    // Add the define function arguments block
    defBlock = defBlock.slice(0, -2) + '],\n\nfunction (';
    for (i = 0; i < defines.length; i++) {
        defBlock += "" + defines[i][1] + ", ";
    }
    defBlock = defBlock.slice(0, -2) + ') {\n\n';

    return defBlock;
}
{% endhighlight %}

Fairly straightforward, so next we need an array mapping search terms to their replacements.

{% highlight javascript %}
var rules = [
    // Basic search replace with empty string
    ['var Badoo = Badoo || {};', ''],
    ['})(Badoo);', '});'],

    // Definition
    // Converts `B.Views.Alert =` to `var AlertView =`
    [/B\.(View|Model|Controller)s\.(\w+)( )?=/g,
        function (str, type, file) {
            return 'var ' + file + ' =';
        }
    ],

    // MVC
    // Converts `B.Controllers.XYZ` to `XYZController` and adds a required module
    [/B\.(View|Model|Controller)s\.(\w+)/g,
        function (str, type, file) {
            var varName = file.indexOf(type) === -1 ? file + type : file;
            defineHelper.add(type + 's/' + file, varName);
            return varName;
        }
    ],

    // Core stuff
    // Matches and saves a required module
    [/B\.(View|UI|Session|Router|Model|History|GlobalEvents|Events|Controller|Api)/g,
        function (str, match) {
            defineHelper.add('Core/' + match, match);
            return match;
        }
    ]

    // and so on...
];
{% endhighlight %}

So that makes up all the rules we need to follow for a global search/replace.

> **Note:** The order of these things is important (e.g. replace `B.Views` first followed by `B.View`)

And now for the magic:

{% highlight javascript %}
for (i = 0; i < rules.length; i++) {
    scriptContent = scriptContent.replace(rules[i][0], rules[i][1]);
}
{% endhighlight %}

This will iterate over the script, doing replaces one by one. Then we concatenate it with `defineHelper.getBlock()` to get the result.

# Conclusion

It took me a day to code up this tool and it made our conversion process an order of magnitude faster. Using this we migrated two projects and their unit tests within a few weeks. It now allows us to have proper modules in the code, manage circular dependencies and generate subsets of the application. This all adds up to make development much easier.

If you have any feedback please drop it in the comments below.
