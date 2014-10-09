---
layout: post
title:  Using regular expressions to hack our way towards AMDfication
author: Nikhil Verma
date:   2014-10-09
categories: javascript regex
---

Badoo MobileWeb project started in early 2012. Due to the initial pace of development, coding conventions and modularisation weren’t given priority. Most of the "modules" lived inside a global object. As the project grew it became difficult to maintain. Bugs became harder to track down. After much internal discussion we found an opportunity to convert our codebase to use AMD modules [RequireJS](http://requirejs.org/docs/whyamd.html), and I'm here to tell you how we did it using regular expressions.

# The Problem

Let me share with you a snippet of the kind of code we were working with.

{% highlight javascript %}
var Badoo = Badoo || {};

(function (B) {
    var Session = B.Session;
    var History = B.History;
    var AppView = B.Views.App;

    var MESSAGES_FOLDER =  B.Models.Folders.TYPES.MESSAGES;

    var App = B.Controllers.App = Badoo.Controller.extend({
        init: function () {
            B.GlobalEvents.on('force-logout', this.onForcedLogout_);
        }
    });

    var instance;

    App.getInstance = function () {
        return instance || (instance = new App('app'));
    };

    return App;

})(Badoo);
{% endhighlight %}

As you can see everything was "global", called directly and had no tracking of dependancies. Fortunately, we had a few good things going for us:

1. The project structure was modular. (e.g ```B.Views.Alert``` was inside ```Views/Alert```)
2. In most cases each file corresponded with it's object name.

# Manual Attempts

Initially we attempted to do this manually, this had the following drawbacks:

1. **Merge Conflicts** - We can't stop adding features to the original project, this means merge conflicts every time there is an update.
2. **Bugs** - The process was error prone, humans are bad at repetetive tasks and we often missed objects or made typos which made debugging frustrating because a huge chunk of the project needed to be converted before we could boot-up the app.
3. **Time** - It took us time to convert each file, and we had 400+ files to go.

I realised that this is something that must be automated. First I tried to experiment with [Esprima](http://esprima.org/), but that turned out to be time consuming and reminded me of this XKCD comic.

[![XKCD](http://imgs.xkcd.com/comics/is_it_worth_the_time.png)](http://xkcd.com/1205/)

What I needed was a quick solution that semi-automated the process.

# Enter Regex

Because most of our project followed predictable conventions I could try implementing something which matches those patterns and generates AMDfied versions. And one of the really cool features in Javascript is that you can pass methods to Regex replace functions.

{% highlight javascript %}
var sentence = 'I like turtles';
var wordCount = 0;

console.log(sentence.replace(/\w+/gi, function (word) {
    return word + ':' + ++wordCount;
}));

// Output: I:1 like:2 turtles:3
{% endhighlight %}

So I set out to make a tool which does the following:

1. Uses [CodeMirror](http://codemirror.net/) as the editor
2. Auto-AMDfies the project, lets us know of any errors using JSHint
3. Requires minors tweaks to get the paste-able result

# The Solution

And I am happy to present the final solution!

<iframe style="border: 0; width: 100%; min-height: 500px;" src="{{page.demodir}}/index.html"></iframe>

When you press "Convert", it reads the contents of the file, applies the Javascript below and writes the final result. As you can see it leaves out some code that needs to be removed manually. I could have fixed that as well, but remembering the XKCD chart I decided it's faster to delete those bits than remove them via code.

> **Note:** <a href="{{page.demodir}}/index.html">If the iframe doesn't work you can visit this page by clicking me.</a>

# Breadown of the solution

First we need to have a method which lets us generate define blocks given the dependancies.

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

Fairly straightforward, next we need an array mapping of searches and replaces.

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
            defineHelper.add(type + 's/' + file, file.indexOf(type) === -1 ? file + type : file);
            return file.indexOf(type) === -1 ? file + type : file;
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

So that makes up all the rules we need to follow for a global search replace.

> **Note:** The order of these things is important (e.g. replace B.Views first followed by B.View)

And now for the magic

{% highlight javascript %}
for (i = 0; i < rules.length; i++) {
    scriptContent = scriptContent.replace(rules[i][0], rules[i][1]);
}
{% endhighlight %}

# Conclusion

It took me a day to code up this tool and it made our conversion process an order of magnitude faster. Using this we migrated two projects and their unit tests within a few weeks.

It now allows us to have proper modules in the code, manage circular dependancies, generate subsets of the application and have an easier time developing it.

If you have any feedback please drop it in the comments below.
