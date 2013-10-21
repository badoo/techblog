---
layout: post
title:  Type Checking in JavaScript
author: Jon Bretman
date:   2013-10-20
categories: javascript
summary: Type checking in JavaScript
---

Here at Badoo we write a lot of JavaScript, our mobile web app contains about 60,000 lines of the stuff, and maintaining that much code can be challenging. One of the trickier aspects of working with a client side JavaScript application of this scale is avoiding exceptions. In this post I want to discuss a particular type of exception that you have probably seem a few times - a [TypeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError).

As the MDN link above explains:

> A TypeError is thrown when an operand or argument passed to a function is incompatible with the type expected by that operator or function.

So to avoid both these cases we need to be checking that the values we pass into functions are correct, and that any code we write checks the validity of an operand before using an operator on it. If you are coming from a statically typed language like Java then this may seem totally horrible, in which case you might want to consider using a compile to JavaScript language like TypeScript or Dart. If however you quite like writing JavaScript, or already have a large code base, all is not lost as performing this type checking does not need to be painful, and can also have a pleasant side effect of helping others to understand you code.

Lets start by looking at a simple function called **privateKeys** that given an object returns an array of the keys that the object contains that start with an underscore. This function utilises both the `Object.keys` and `Array.prototype.filter` methods.

{% highlight javascript %}
var privateKeys = function (obj) {
    return Object.keys(obj).filter(function (key) {
        return key.charAt(0) === '-';
    });
};
{% endhighlight %}

If we call this method with an object or array then it does what we expect it to but if we call it with other value we get a TypeError.

{% highlight javascript %}
// both fine
privateKeys({foo: 'foo', _bar: 'bar'}); // ['_bar'];
privateKeys([1,2,3,4]); // [];

// all these throw: "TypeError: Object.keys called on non-object"
privateKeys(null);
privateKeys('foo');
privateKeys(5);
{% endhighlight %}