---
layout: post
title:  Type Checking in JavaScript
author: Jon Bretman
date:   2013-11-01
categories: javascript
summary: Type checking in JavaScript
---

Here at Badoo we write a lot of JavaScript, our mobile web app contains about 60,000 lines of the stuff, and maintaining that much code can be challenging. One of the trickier aspects of working with a client side JavaScript application of this scale is avoiding exceptions. In this post I want to discuss a particular type of exception that you have probably seen a few times - a [TypeError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError).

As the MDN link above explains:

> "A TypeError is thrown when an operand or argument passed to a function is incompatible with the type expected by that operator or function" - MDN

So to avoid both these cases we need to be checking that the values we pass into functions are correct, and that any code we write checks the validity of an operand before using an operator on it. If you are coming from a statically typed language like Java then this may seem totally horrible, in which case you might want to consider using a compile to JavaScript language like TypeScript or Dart. If however you quite like writing JavaScript, or already have a large code base, all is not lost as performing this type checking does not need to be painful, and can also have a pleasant side effect of helping others to understand you code.

Lets start by looking a fairly straight forward example of getting some data from the server, performing some operations on that data, and then using it to render some HTML.

{% highlight javascript %}
Api.get('/conversations', function (conversations) {

    var intros = conversations.map(function (c) {
        var name = c.theirName;
        var mostRecent = c.messages[0].text.substring(0, 30);
        return name + ': ' + mostRecent;
    });

    App.renderMessages(intros);

});
{% endhighlight %}

The first thing to note is that from looking at this code we don't actually know what `messages` is supposed to be. We could assume that since it's obviously expected to have a `map` function that it should be an array, but assumptions are bad and in reality it could be anything that implements a `map` method.

Let's assume that `conversations` is supposed to be an array though and see how we can go about checking the validity of it's type. Before going any further let's look at the different methods of checking for types in JavaScript.

### typeof
The `typeof` operator returns a string indicating the type of the operand, but the types it returns are very limited. For example the following all return **"object"**

{% highlight javascript %}
typeof {};
typeof [];
typeof null;
typeof document.createElement('div');
typeof /abcd/;
{% endhighlight %}

### instanceof
The `instanceof` operator is used to determine if an objects prototype chain contains the prototype property of a given constructor. So to test for an array we could do the following.

{% highlight javascript %}
conversations instanceof Array;
{% endhighlight %}

Although this will work, using `instanceof` for checking the type of a native object is not a great idea as it does not work correctly for primitives, as shown below.

{% highlight javascript %}
'a' instanceof String; //false
5 instanceof NUmber; // false
true instanceof Boolean; //false
{% endhighlight %}

### Object.prototype.toString
The `toString` method on `Object.prototype` is used by many JavaScript frameworks to infer type and this is basically because the spec for this method is very clear and has been implemented consistently across all browsers. Point **15.2.4.2** of the [ECMA-262](http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf) spec says:

* If the this value is undefined return `"[object Undefined]"`.
* If the `this` value is null, return `"[object Null]"`.
* Let O be the result of calling ToObject passing the this value as the argument.
* Let class be the value of the \[\[Class\]\] internal property of O.
* Return the String value that is the result of concatenating the three Strings `"[object "`, class, and `"]"`.

So basically this method will always return a String in the form "\[object Foo\]" where **Foo** is going to be the internal Class used to create `this`. By using `Function.prototype.call` and a simple regular expression we can write a little method that will return the internal class property of any object.

{% highlight javascript %}
var type = function (o) {
    var s = Object.prototype.toString.call(o);
    return s.match(/\[object (.*?)\]/)[1].toLowerCase();
}

type({}); // "object"
type([]); // "array"
type(5); // "number"
type(null); // "null"
type(); // "undefined"
type(/abcd/); // "regex"
type(new Date()); // "date"
{% endhighlight %}

So this must be problem solved, right? Sadly no. There are still a few instances where this method will return values other than we would expect.

{% highlight javascript %}
type(NaN); // "number"
type(document.body); // "htmlbodyelement"
{% endhighlight %}

Both of these cases return values that we probably wouldn't expect. In the case of `NaN` it returns `"number"` because technically `NaN` is a type of number, although in nearly all cases we want to know if something is a number, not **NOT** a number. The internal class used to implement the `<body>` element is `HTMLBodyElement` (at least in Chrome and Firefox) and there are specific classes for every element, meaning that the `type` method can't be reliably used to check something is an element. However we can modify our existing method to handle these cases.

{% highlight javascript %}
var type = function (o) {

    // handle null in old IE
    if (o === null) {
        return 'null';
    }

    // handle DOM elements
    if (o && (o.nodeType === 1 || o.nodeType === 9)) {
        return 'element';
    }

    var s = Object.prototype.toString.call(o);
    var type = s.match(/\[object (.*?)\]/)[1].toLowerCase();

    // handle NaN and Infinity
    if (type === 'number') {
        if (isNaN(o)) {
            return 'nan';
        }
        if (!isFinite(o)) {
            return 'infinity';
        }
    }

    return type;
}
{% endhighlight %}

So now we have a method that will return the correct type for all the things we are interested in we can improve the original example to ensure that we don't have any `TypeError`'s.

{% highlight javascript %}
Api.get('/conversations', function (conversations) {

    // anyone reading this now knows
    // that conversations should be an array
    if (type(conversations) !== 'array') {
        App.renderMessages([]);
        return;
    }

    var intros = conversations.map(function (c) {

        if (type(c) !== 'object') {
            return '';
        }

        var name = type(c.theirName) === 'string' ? c.theirName : '';
        var mostRecent = '';

        if (type(c.messages) === 'array' ||
            type(c.messages[0]) === 'object' ||
            type(c.messages[0].text) === 'string') {
            mostRecent = c.messages[0].text.substring(0, 30);
        }

        return name + ': ' + mostRecent;
    });

    App.renderMessages(intros);

});
{% endhighlight %}

Obviously there is no getting away from the fact that we have had to add quite a lot of additional code to avoid the risk of `TypeError`'s, but here at Badoo we would always rather send a few extra KB's of JavaScript down the wire if it means our application is a bit more stable.

Finally, the rather obvious downside of the `type` method is that it requires checking the return value against a string every time. This is easily improved though. We can create an API similar to Underscore / LoDash / jQuery by doing the following:

{% highlight javascript %}
['Null',
 'Undefined',
 'String',
 'Boolean',
 'Function',
 'RegExp',
 'Element',
 'NaN',
 'Infinite'
].forEach(function (t) {
    type['is' + t] = function (o) {
        return type(o) === t.toLowerCase();
    };
});

// examples:
type.isObject({}); // true
type.isNumber(NaN); // false
type.isElement(document.createElement('div')); // true
type.isRegExp(/abc/); // true
{% endhighlight %}

So that is how we handle type checking in JavaScript at Badoo. The code for `type` method explained in this post is available [here](https://gist.github.com/jonbretman/7259628).