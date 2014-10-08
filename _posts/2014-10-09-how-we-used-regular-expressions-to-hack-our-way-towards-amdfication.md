---
layout: post
title:  How we used regular expressions to hack our way towards AMDfication
author: Nikhil Verma
date:   2014-10-09
categories: javascript regex
---

Thanks to the fast paced development of the javascript ecosystem, we have seen emerging tools and guidelines that help developers organise and maintain their code.

Grunt and Gulp enable the developers to automate their build process. RequireJS and Browserify make it easier to modularise code and understand the dependency tree. JSHint and JSCS let you have coding conventions etc.

Badoo MobileWeb project started in early 2012. Due to the initial pace of development, coding conventions and modularisation weren’t given priority. Most of the "modules" lived inside a global ‘B’ object. As the project grew it became increasingly difficult to maintain. After much internal discussion we found an opportunity to fix that, and I'm here to tell you how we did it so quickly.

# The Problem

Let me share with you a small snippet of the kind of code we were working with.

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

As you can see everything was "global", called directly and had no tracking of dependancies.

Fortunately, we had a few good things going for us:

1. The project structure was modular (e.g B.View.Alert was inside Views/Alert)
2. In most cases each file corresponded with it's object name

# Manual Attempts

Initially we attempted to do this manually, this had the following drawbacks:

1. **Merge Conflicts** - We can't stop adding features to the original project, this means merge conflicts every time there is an update
2. **Bugs** - The process was error prone, humans are bad at repetetive tasks and we often missed objects or made typos which made debugging frustrating because a huge chunk of the project needed to be converted before we could boot the app
3. **Time** - It took us a lot of time to convert each file, and we had 200+ files to go.

I finally realised that this is something that must be automated. Initially I tried to experiment with Esprima, but that turned out to be time consuming and reminded me of this XKCD comic.

[![XKCD](http://imgs.xkcd.com/comics/is_it_worth_the_time.png)](http://xkcd.com/1205/)

# Enter Regex

I realised that because most of our project followed predictable conventions we could try implementing something which matches those patterns and generates AMDfied scripts. And one of the really cool features in javascript is that you can pass methods to regex replace functions.

{% highlight javascript %}
var sentence = 'I like turtles';
var wordCount = 0;

console.log(sentence.replace(/\w+/gi, function (word) {
    return word + ':' + ++wordCount;
}));

// Output: I:1 like:2 turtles:3
{% endhighlight %}

So I set out to make a tool which does the following:

1. Uses a good GUI like CodeMirror to allow us to paste the content of files
2. Auto-AMDfies the project, lets us know of any errors using JSHint
3. Requires minors tweaks to get the paste-able result

# The Solution

I am happy to present the final solution!

When you press "Convert", it reads the contents of the file, applies the javascript below and writes the final result. As you can see it leaves out some bits that need to be removed manually. I could have fixed that as well, but remembering the XKCD graph I decided it's faster to delete those bits than remove them via code.

<iframe style="border: 0; width: 100%; min-height: 500px;" src="{{page.demodir}}/index.html"></iframe>

> **Note:** <a href="{{page.demodir}}/index.html">If the iframe doesn't work you can visit this page by clicking me.</a>


# Conclusion

It took me a day to write up this tool and the it made our conversion process an order of magnitude faster. Using this we migrated two projects and their unit tests within a few weeks.

It now allows us to have proper mode in the code, manage circular dependancies, generate sub-sets of the application and overall have a good time :-)

If you have any feedback please drop it in the comments below.
