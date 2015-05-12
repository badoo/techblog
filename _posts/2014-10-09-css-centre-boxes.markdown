---
layout: post
title:  Can you center a grid of images using only CSS?
author: Anton Laurens
date:   2014-10-09
categories: javascript css
---

In this article I'd like to discuss a UI problem I was faced with in the past, which I still have no elegant solution for. It seems completely reasonable for this
problem to have a simple CSS solution, yet I have not been able to discover one so far. I ended up solving the problem in Javascript; it felt wrong and it felt like a cop out.

I first came across this problem around the time I started interviewing candidates for mobile web positions at Badoo,
so I thought, why not kill two birds with one stone? After roughly 20+ interviews, most candidates are able to solve the problem, but they all resort to Javascript after failing to complete the problem using only CSS.

Is it possible? It is such a simple UI pattern we see used on the web all the time. Let me talk you through the problem:

# Problem

We want to be able to render a grid of images in such a way, that:

1. The grid items are square and have a fixed width and height, with a fixed margin surrounding the image.
2. The maximum amount of grid items should fit into the given screen width.
3. The grid itself should be centred on the screen, thus the margin on either sides of the grid should be the same.
4. The items in the grid are left-aligned.
5. The amount of grid items are not predetermined.
6. The screen width is not fixed (ie. users can resize on desktop or change the device orientation on mobile)
7. This grid should work on all smartphones and desktop browsers.

If we depict these requirements graphically:

![Output]({{page.imgdir}}/boxes.png)

And if we look at this problem mathematically, we see that the equation we are trying to satisfy is:

<img class="no-box-shadow" src="/images/css-centre-boxes/eq01.png"/>

where:

<img class="no-box-shadow" src="/images/css-centre-boxes/eq02.png"/>

Our end goal is to render something like this on multiple devices in either portrait or landscape satisfying all the requirements in the list:

![Output]({{page.imgdir}}/03.png)


# Markup

Let's start by creating simple HTML markup and CSS as a starting point:

HTML:

{% highlight html %}

<ul class="grid">
    <li class="grid-item"></li>
    <li class="grid-item"></li>
    <! -- more grid items -->
</ul>

{% endhighlight %}

CSS:

{% highlight css %}

.grid {
    padding: 0;
}

.grid-item {
    float: left;
    margin: 2px;
    width: 95px;
    height: 95px;
    background-color: black;
}

{% endhighlight %}

This would output the following:

![Output]({{page.imgdir}}/initial.png)

And it violates:

> Nr 3: The grid itself should be centred on the screen, thus the margin on either sides of the grid should be the same.

## 'Solution' 1

Usually people's first impulse would be to add `text-align: center` to `.grid`. I guess it's fair enough to try that initially, although at the moment our grid-items are floating left and adding text alignment will actually have no effect. Let's play devil's advocate anyway by removing `float: left;` from `.grid-item` and replace it with `display: inline-block;` and add `text-align: center` to `.grid`:

![Output]({{page.imgdir}}/solution_1.png)

This is not a bad solution, it ticks all our boxes, except:

> Nr 4:  The items in the grid are left-aligned.

## 'Solution' 2

People then have an 'aha!' moment and add `margin: 0 auto` to `.grid`. This has no effect as the grid has no fixed width, so no margin can be automatically calculated.

Which then leads people to start adding fixed widths:

### Fixed width v 1.0

Let's assume an iPhone 6 Plus and changing `.grid` to:

{% highlight css %}

.grid {
    padding: 0;
    margin: 0 auto;
    width: 396px // four boxes with 95px width/ height + 2px margin either side
}

{% endhighlight %}

we get what we wanted!

![Output]({{page.imgdir}}/solution_2_1_1.png)

but as soon as we change the orientation of the device we get:

![Output]({{page.imgdir}}/solution_2_1_2.png)

so now we are failing:

> Nr 2: The maximum amount of grid items should fit in the given screen width.

### Fixed width v 2.0

Well that's not a problem, let's solve it by adding media queries:

{% highlight css %}

.grid {
    padding: 0;
    margin: 0 auto;
}

@media only screen
and (min-device-width : 414px)
and (max-device-width : 736px)
and (orientation : landscape)
and (-webkit-min-device-pixel-ratio : 3) {
    .grid {
        width: 693px; // seven boxes with 95px
                      // width/ height + 2px margin either side
    }
}

@media only screen
and (min-device-width : 414px)
and (max-device-width : 736px)
and (orientation : portrait)
and (-webkit-min-device-pixel-ratio : 3) {
    .grid {
        width: 396px; // four boxes with 95px
                      // width/ height + 2px margin either side
    }
}

{% endhighlight %}

So now it works on landscape on iPhone 6 Plus as well!

![Output]({{page.imgdir}}/solution_2_2.png)

But we still have that last requirement:

> Nr 6: The screen width is not fixed (ie. users can resize on desktop or change the device orientation on mobile)

And no, please do not suggest adding even more media queries.

### Fixed width v 3.0

Now this is where people start bringing Javascript into the solution. Using the equation set out earlier, we can calculate the container width by:

<img class="no-box-shadow" src="/images/css-centre-boxes/eq03.png"/>

JS

{% highlight css %}
(function() {
    var margin_ = 2;
    var boxWidth_ = 95;
    var container_ = document.querySelector('.grid');

    function setGridWidth() {
        var boxSize = (2 * margin_) + boxWidth_;
        container_.style.width = (Math.floor(window.innerWidth / boxSize) * boxSize) + "px";
    }

})();
{% endhighlight %}

Of course this Javascript can be improved by getting the margin/ box width values on the fly, but you get the idea. If this function is then hooked to init, resize and orientation change events,
we'll end up satisfying all the requirements:

<table>
<tr>
    <td><img src="/images/css-centre-boxes/02.png"/></td>
    <td><img src="/images/css-centre-boxes/01.png"/></td>
    <td><img src="/images/css-centre-boxes/04.png"/></td>
    <td><img src="/images/css-centre-boxes/03.png"/></td>
</tr>
</table>

But it's still oddly unsatisfying.

# 'Solution' 3

Now there is one thing we could do that only uses CSS. If we jig the previous equation around a bit we could calculate the GridWidth using:

<img class="no-box-shadow" src="/images/css-centre-boxes/eq04.png"/>

let's use that in our CSS:

{% highlight css %}

.grid {
    list-style: none;
    padding: 0;
    width: calc(100% - ((100% mod 99px)));
}

{% endhighlight %}

`CSS calc()` to the rescue!! Unfortunately it comes with a massive caveat. It is not yet well adopted in mobile browsers, especially Android and also the `mod` operator
is only supported in the latest versions of IE.

Thus we fall over this hurdle:

> Nr 7: This grid should work on all smartphones and desktop browsers.

# Conclusion

We found two solutions, one using only CSS (but with a method that isn't yet widely adopted) then also with Javascript. There must be another simple way!

Please comment and let me know! :)