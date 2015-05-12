---
layout: post
title:  Fixed Headers in Mobile Webapps
author: Nikhil Verma
date:   2013-07-08
categories: javascript mobile-web
---

> **Note:** This techniques in this article are now out of date due to various changes to iOS Safari and Chrome becoming the default WebView for Android.

When building mobile web apps there is often a desire to try and make it look and feel as "native" as possible. Whether it is the styling of components, the use of transitions, or just general speed and performance, actually achieving these things can often be much more difficult than it first seems. This article explains some of the challenges we faced when trying to implement one of these "native" features - a fixed header.

Normally you would expect fixed headers to work by setting their css to ```position: fixed;``` which works in most of the cases except for when you need to type something in a form element. Almost all mobile browsers push your page up to make room for the keyboard and your text element to be on the screen thus pushing your fixed header out of the way. This is a bad user experience because headers in mobile applications are the entrypoints for most user interactions.

When developing the chat page for our Hot or Not application for iOS we ran into the same problem. Here is an example of what it looks like:

![Fail]({{page.imgdir}}/1.gif)

<a class="button" href="{{page.demodir}}/problem.html">Demo</a>
*Make sure you are viewing the demo page in a mobile browser to actually see it work*

Before we start to fix this problem there are two things we need to do first.

### Hide the browser address bar

If a user is visiting your website from a mobile browser, you can hide the address bar in certain cases to give you more screen space. There are plenty of good solutions you can find on the internets that will help you do that. For the sake of our demo we will use the snippet below.

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

### Remove the user interaction delay on mobile browsers

In short, the mobile browsers have a noticieable lag (~300 milliseconds) from when you tap on something to an action being taken for that tap. That's because the browser is waiting to see if you wanted to do a double tap. This shouldn't have been an issue if mobile browsers respected the ```user-scalable``` and ```device-width``` property better. Chromium has a [ticket](https://code.google.com/p/chromium/issues/detail?id=169642) and a [patch](https://codereview.chromium.org/18850005/) for it already.

In the meanwhile we have to fix this because if you let the browser delay you for that long, it's already too late and your page would have begun it's scroll animation.

To fix the delay I recommend the usage of [FastClick](https://github.com/ftlabs/fastclick), however be aware that there is a bug in the library which makes it fail sometimes on input elements. There is a ticket for that [here](https://github.com/ftlabs/fastclick/issues/132).

As well as removing the delay for click events, FastClick also speeds up focus events on form fields. The snippet below is a very simplified version of what's going on inside FastClick.

{% highlight javascript %}
document.querySelector('input').addEventListener('touchend', function(){
    this.focus();
});
{% endhighlight %}

Now to prevent the page from scrolling, we have to listen to the ```window.onscroll``` event and set the scroll to 0 everytime it happens to prevent the browser from moving the page.

{% highlight javascript %}
var preventScrolling = function() {
    window.onscroll = function() {
        // prevent further scrolling
        document.body.scrollTop = 0;
    }

    // set the scroll to 0 initially
    document.body.scrollTop = 0;
}

var allowScrolling = function() {
    window.onscroll = null;
}

window.addEventListener('focus', preventScrolling, true);
window.addEventListener('blur', allowScrolling, true);
{% endhighlight %}

So on the focus of an input element we prevent any kind of page scrolling, and enable it back when the user has finished typing. Here is how it looks like now:

![Fail again]({{page.imgdir}}/2.gif)

<a class="button" href="{{page.demodir}}/1.html">Demo</a>

Well that wasn't very helpful was it? The keyboard completely hides our input when it comes up because we didn't let it scroll. To fix that problem we simply have to measure the amount by which our page scrolled when the user input came in focus, that will tell us the height of the keyboard so that we can move our input element into the view manually.

{% highlight javascript %}
var focusHeight = 0;

var preventScrolling = function () {
    // Android devices don't deploy their keyboards immediately, so we wait
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

    // move the input into the view
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

Let's see how that looks now:

![Great Success]({{page.imgdir}}/3.gif)

<a class="button" href="{{page.demodir}}/2.html">Demo</a>

Great Success ! We now have a fixed header.