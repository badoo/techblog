---
layout: post
title:  5 Advanced Javascript and Web Debugging Techniques You Should Know About
author: Nikhil Verma
date:   2013-11-18
categories: javascript
---

In this article we will discuss 5 advanced techniques which web developers can use to reduce the time they spend debugging and squash challenging bugs by using new tools available to us and taking advantage of the new features offered by debuggers.

1. [Weinre](#weinre)
2. [DOM Breakpoints](#dom_breakpoints)
3. [The 'debugger' statement](#the_debugger_statement)
4. [Hooking into native methods](#hooking_into_native_methods)
5. [Mapping remote scripts locally](#mapping_remote_scripts_locally)

---

# Weinre

According to the official description _weinre stands for **we**b **in**spector **re**mote. It is a debugger for web pages, like FireBug (for FireFox) and Web Inspector (for WebKit-based browsers), except it's designed to work remotely, and in particular, to allow you debug web pages on a mobile device such as a phone._

![Weinre]({{page.imgdir}}/weinre.png)

Weinre essentially allows you to remotely debug webpages on devices and browsers which don’t come with native debugging support. It aims to replicate the UI of Chrome Developer Tools and provide most of it’s functionality. This tool is extremely handy for debugging DOM/CSS issues but also works really well for debugging javascript as well.

## Installation

{% highlight bash %}
$ sudo npm -g install weinre
{% endhighlight %}

Weinre can be installed using npm. Or you can download binary packages from [here](http://people.apache.org/~pmuellr/weinre/docs/latest/Installing.html).

After installation just run the command ```weinre``` in your terminal and it would start up the weinre server on it's default port 8080. You can customize the port if you need to.

Next navigate to ```your_hostname:8000``` where you will have two options to inject weinre into the page you want to debug:

* Copy the script block and paste it in your page's html
* Add the bookmarklet on your phone to allow weinre to run on any site.

Once you do that you can debug any page on any browser or device as if you were using the Chrome Devtools on it! It does have some limitations however. Because weinre is simply a script injector it won't provide you with the ability to put breakpoints inside your javascript code. But the console in weinre is really good for seeing javascript logs and doing other debugging tasks.

> **Note:** If you don't want the complexity of setting up weinre, you can also use a remotely hosted version of it at [http://debug.build.phonegap.com/](http://debug.build.phonegap.com/)

> **Note:** For a better debugging environment on iOS Safari you can try out [iOS Webkit Debug Proxy](https://github.com/google/ios-webkit-debug-proxy). It's not completely stable yet but offers a better alternative to Safari DevTools.

---

# DOM Breakpoints

DOM breakpoint is a feature provided by Firebug and Chrome Devtools that allows you to pause your script execution as soon as a certain node in the DOM is modified.

The benefit of using DOM breakpoints is that because of the asynchronous nature of javascript it’s sometimes easier to know when a DOM tree will change rather than setting breakpoints at every possible location in your code which might modify it.

To use a DOM breakpoint:

* Go to the elements view in your debugger
* Right click on the node you want to break on modification
* Select the desired break action

![Weinre]({{page.imgdir}}/dom.png)

> **Note:** In Firebug you can find all the breakpoints in the ```Script>Breakpoints``` tab. In Chrome Devtools you can find them in the ```Elements>DOM Breakpoints``` tab.

---

# The 'debugger' statement

The ```debugger``` statement allows you to pause the javascript execution at arbitrary points in your code provided your debugger is open at that moment.

This can be extremely handy because it let's you strategically put breakpoints in your code to when certain conditions are met. This is much easier to pull off compared to using conditional breakpoints.

To use it all you have to do it put the statement inside your javascript code where you want the break to happen.

{% highlight bash %}
if (waldo) {
    debugger;
}
{% endhighlight %}

Now with your console open, whenever the javascript interpreter will hit that condition it will cause a break in your script execution. Just don't release it with your production code :)

> **Note:** If you didn't know about conditional breakpoints. Here is a quick overview on how to use breakpoints in [Chrome DevTools](https://developers.google.com/chrome-developer-tools/docs/javascript-debugging#breakpoints)

---

# Hooking into native methods

Because the browser and window javascript methods aren't protected you can hook into them to add your own functionality or debugging code. This technique is really useful when you know the problem occurring but can't track down the source of it. Or if you want to mock some javascript methods.

**Let's take an example:** Suppose you are noticing an unexpected attribute being modified on a DOM element. You know the attribute or it's value but you find it harder to track down the line of the code which does that.

In that case you can hook into the ```setAttribute``` method with your own and add debug code in it to find out the problem like so:

{% highlight bash %}
var oldFn = Element.prototype.setAttribute;

Element.prototype.setAttribute = function (attr, value) {
    if (value === "the_droids_you_are_looking_for") {
        debugger;
    }
    oldFn.call(this, attr, value);
}
{% endhighlight %}

Now whenever an element's attribute is modified to the value you want the script will pause executing and you can find out the cause of the problem from the call stack.

> **Note:** This is generally how [Prototype](http://prototypejs.org/) and [SinonJS](http://sinonjs.org/) work. But it's not guaranteed to work in all browsers, for example in iOS Safari in Private mode you can't access or attempt to modify the localStorage methods.

---

# Mapping remote scripts locally

This method simply allows you to proxy any remote script url's to a local file on your disk. Where you can modify the file according to your wish and have it act as if the file was modified from the source. This can come in really handy if you are debugging a problem where the source is minified and/or you don't have the ability to modify the file (think production environments).

> **Note:** This does require you to download and install a paid third party app on your machine. There are free alternatives to this method but they require a manual setup of proxies and http servers.

### How to do it:

- Download [Charles Proxy](http://www.charlesproxy.com/) which is a fantastic proxy tool for debugging network connections
- Enable Charles for either the whole system or your browser
- Download the remote file that you wish to debug and save it locally
- Unminify the file and add any debug code that you wish to
- In Charles: Tools > Map Local
- Choose the local file and then modify the remote file to point like the screenshot below. You can even map entire hostnames.
- Reload the page
- The remote URL is now read from your locally saved file.

![Charles]({{page.imgdir}}/charles.png)

### Benefits of mapping remote files locally
- Allows you to debug production code when sourcemaps aren’t available.
- Allows you to actually make modifications to the code where it wasn’t previously possible.

> **Note:** Chrome developer tools has a [file mapping system](https://developers.google.com/chrome-developer-tools/docs/settings#workspace) as well but it currently only works one way. As in it allows you to edit files in the devtools and save it on the disk and reflect the changes for that session. But as soon as you reload your page the files are fetched from the server and not actually read from the disc because it assumes your save actions will have modified the source file. It would be a great feature to have in devtools in the future.

---

If you had any problems following something in the article please drop a comment.