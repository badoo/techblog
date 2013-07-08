---
layout: post
title:  Static Headers in Mobile Webapps
author: Nikhil Verma
date:   2013-07-08
categories: javascript
---

When developing the chat page for HotorNot we ran into the problem where they keyboard appearance would scroll the whole page up thus making the chat experience jerky and not very user friendly. This article will attempt to explain how we fixed that problem.

Before we start there are two things we need to consider first:

### We need to hide the browser address bar

To do that we can use the code snippet below.
Note: The snippet is only for the purposes of this demo and not something you should use as it is on production.

{% highlight javascript %}
var hideAddressbar = function(){
    document.body.style.minHeight = '1000px';
    window.scrollTo(0, 0);
    document.body.style.minHeight = window.innerHeight + 'px';
}

window.addEventListener('load', function() {
    hideAddressbar();
}, false);

window.addEventListener('touchstart', hideAddressbar);
{% endhighlight %}

### There is ~300ms delay on mobile browsers before any touch event progresses to allow double taps.

To fix the 300ms delay I recommend the usage of [FastClick](https://github.com/ftlabs/fastclick), however be aware that there is a bug on FastClick which makes it fail sometimes on input elements. There is a ticket for that [here](https://github.com/ftlabs/fastclick/issues/132).

For the sake of this demo we will be using a simple script to emulate what FastClick does.

{% highlight javascript %}
document.querySelector('input').addEventListener('touchend', function(){
    this.focus();
});
{% endhighlight %}

Now to keep the page from scrolling, we have to listen to the ```window.onscroll``` event and set the scroll to 0 everytime it happens.

{% highlight javascript %}
var preventScrolling = function() {
    document.body.scrollTop = 0;
    window.onscroll = function(){
        document.body.scrollTop = 0;
    }
}

var allowScrolling = function() {
    window.onscroll = null;
}

window.addEventListener('focus', preventScrolling, true);
window.addEventListener('blur', allowScrolling, true);
{% endhighlight %}

To see a demo page in action click on the link below. Make sure you are viewing the page in a mobile browser to actually see it work :-)

<a class="button" href="/demo/static-header/1.html">Demo</a>

Well that wasn't very helpful was it? The keyboard completely hides our input when it comes up.

This happens because mobile browsers scroll the page up on focus so that the focussed element can come into the view of the user. We can work around this problem by measuring the scroll height right after the keyboard pops up and moving our text input to the correct position accordingly.

{% highlight javascript %}
var focusHeight = 0;

var preventScrolling = function () {
    // Android devices don't deploy their keyboards immidiately, so we wait
    // for them to deploy every 100ms
    if (document.body.scrollTop < 1) {
        setTimeout(function () {
            preventScrolling();
        }, 100);
        return;
    }

    focusHeight = document.body.scrollTop;

    window.onscroll = function () {
        document.body.scrollTop = 0;
    }
    document.body.scrollTop = 0;

    input.style.marginBottom = focusHeight + 'px';
};

 // Allow page scrolling
var allowScrolling = function () {
    window.onscroll = null;
    input.style.marginBottom = '0px';
};

document.body.addEventListener('focus', preventScrolling, true);
document.body.addEventListener('blur', allowScrolling, true);
{% endhighlight %}

Now our page doesn't scroll and the keyboard animates up into the view.

<a class="button" href="/demo/static-header/2.html">Demo</a>
