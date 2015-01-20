---
layout: post
title:  Android Handler Memory Leaks
author: Dmytro Voronkevych
date:   2014-08-28
categories: android
---
Android uses Java as a platform for development.
This helps us with many low level issues including memory management,
platform type dependencies, and so on.
However we still sometimes get crashes with *OutOfMemory*.
So where’s the garbage collector?

I’m going to focus on one of the cases where big objects in memory can’t be
cleared for a lengthy period of time. This case is not ultimately a memory leak -
objects will be collected at some point - so we sometimes ignore it.
This is not advisable as it can sometimes lead to *OOM* errors.

The case I’m describing is the *Handler leak*, which is usually detected as a
warning by Lint.

Basic Example
-------------
![Basic Code Sample]({{page.imgdir}}/anonymous_runnable_code.png)

This is a very basic activity. Notice that this anonymous `Runnable` has been
posted to the `Handler` with a very long delay. We’ll run it and rotate the
phone couple of times, then dump memory and analyze it.

![Analyse HPROF]({{page.imgdir}}/anonymous_runnable_memory_analyze.png)

We have seven activities in memory now. This is definitely not good.
Let’s find out why GC is not able to clear them.

> The query I made to get a list of all Activities remaining in memory was created
> in OQL (Object Query Language), which is very simple, yet powerful.

![Analyse HPROF]({{page.imgdir}}/anonymous_runnable_memory_explained.png)

As you can see, one of the activities is referenced by `this$0`.
This is an indirect reference from the anonymous class to the owner class.
`This$0` is referenced by `callback`, which is then referenced by
a chain of `next`’s of `Message` back to the main thread.

> Any time you create a non-static class inside the owner class,
> Java creates an indirect reference to the owner

Once you post `Runnable` or `Message` into `Handler`, it’s then stored in list
of `Message` commands referenced from `LooperThread` until
the message is executed. Posting delayed messages is a clear leak for at least
the time of the delay value. Posting without delay may cause a temporary leak
as well if the queue of messages is large.

Static Runnable Solution
------------------------
Let’s try to overcome a memory leak by getting rid of `this$0`, by converting
the anonymous class to static.

![Static runnable code]({{page.imgdir}}/StaticClass_code.png)

Run, rotate and get the memory dump.

![Analyse static runnable HPROF]({{page.imgdir}}/StaticClass_memory_analyze.png)

What, again? Let’s see who keeps referring to `Activities`.

![Analyse static runnable HPROF]({{page.imgdir}}/StaticClass_memory_analyze_explained.png)

Take a look at the bottom of the tree - activity is kept as a reference
to `mContext` inside `mTextView` of our `DoneRunnable` class.
Using static inner classes is not enough to overcome memory leaks, however.
We need to do more.

Static Runnable With WeakReference
----------------------------------
Let’s continue using iterative fixes and get rid of the reference to TextView,
which keeps activity from being destroyed.

![Static runnable with weak reference]({{page.imgdir}}/StaticClassWithWeakRef_code.png)

Note that we are keeping WeakReference to TextView, and let’s run, rotate and
dump memory.

> Be careful with WeakReferences. They can be null at any moment,
so resolve them first to a local variable (hard reference) and then check
to null before use.


![Analyse static runnable with weak reference HPROF]({{page.imgdir}}/StaticClassWithWeakRef_memory_analyze.png)

Hooray! Only one activity instance. This solves our memory problem.

So for this approach we should:

* Use static inner classes (or outer classes)
* Use `WeakReference` to all objects manipulated from `Handler`/`Runnable`

If you compare this code to the initial code, you might find a big difference in
readability and code clearance. The initial code is much shorter and much
clearer, and you’ll see that eventually, text in `textView` will be
changed to ‘Done’. No need to browse the code to realise that.

Writing this much boilerplate code is very tedious, especially if `postDelayed`
is set to a short time, such as 50ms. There are better and clearer solutions.

Cleanup All Messages onDestroy
------------------------------
Handler class has an interesting feature - `removeCallbacksAndMessages` -
which can accept `null` as argument. It will remove all `Runnables` and
`Messages` posted to a particular handler. Let’s use it in `onDestroy`.

![Remove callbacks code]({{page.imgdir}}/removeCallbacks_code.png)

Let’s run, rotate and dump memory.

![Analise remove callbacks HPROF]({{page.imgdir}}/removeCallbacks_memory_analyze.png)

Good! Only one instance.

This approach is way better than the previous one, as it keeps code clear and
readable. The only overhead is to remember to clear all messages on
`activity`/`fragment` destroy.

I have one more solution which, if you’re lazy like me, you might like even more. :)

Use WeakHandler
---------------

The Badoo team came up with the interesting idea of introducing `WeakHandler` -
a class that behaves as `Handler`, but is way safer.

It takes advantage of hard and weak references to get rid of memory leaks.
I will describe the idea in detail a bit later, but let’s look at the code first:

![WeakHandler code]({{page.imgdir}}/WeakHandler_code.png)

Very similar to the original code apart from one small difference -
instead of using `android.os.Handler`, I’ve used `WeakHandler`.
Let’s run, rotate and dump memory:

![Analise remove callbacks HPROF]({{page.imgdir}}/WeakHandler_memory_analyze.png)

Nice, isn’t it? The code is cleaner than ever, and memory is clean as well! :)

To use it, just add dependency to your build.gradle:
{% highlight groovy %}
repositories {
    maven {
        repositories {
            url 'https://oss.sonatype.org/content/repositories/releases/'
        }
    }
}

dependencies {
    compile 'com.badoo.mobile:android-weak-handler:1.0'
}
{% endhighlight %}

And import it in your java class:
{% highlight java %}
import com.badoo.mobile.util.WeakHandler;
{% endhighlight %}

Visit Badoo's github page, where you can fork it, or study it's
source code [https://github.com/badoo/android-weak-handler](https://github.com/badoo/android-weak-handler)

WeakHandler. How it works
-------------------------

The main aim of `WeakHandler` is to keep `Runnables`/`Messages`
hard-referenced while `WeakHandler` is also hard-referenced. Once it can be
GC-ed, all messages should go away as well.

Here is a simple diagram that demonstrates differences
between using normal `Handler` and `WeakHandler` to post anonymous runnables:

![WeakHandler diagram]({{page.imgdir}}/WeakHandler.png)

Looking at the top diagram, `Activity` keeps a reference to `Handler`,
which posts `Runnable` (puts it into queue of Messages referenced from Thread).
Everything is fine except the indirect reference from `Runnable` to `Activity`.
While `Message` is in the queue, all graphs can’t be garbage-collected.

By comparison, in the bottom diagram `Activity` holds `WeakHandler`, which keeps
`Handler` inside. When we ask it to post `Runnable`, it is wrapped into
`WeakRunnable` and posted. So the `Message` queue keeps reference only to
`WeakRunnable`. `WeakRunnable` keeps weak reference to the desired `Runnable`,
so the `Runnable` can be garbage-collected.

Another little trick is that `WeakHandler` still keeps a hard reference to the
desired `Runnable`, to prevent it from being garbage-collected
while `WeakRunnable` is active.

The side-effect of using WeakHandler is that all messages and runnables
may not be executed if WeakHandler has been garbage-collected.
To prevent that, just keep a reference to it from Activity.
Once Activity is ready to be collected,
all graphs with WeakHandler will collected as well.

Conclusions
-----------
Using `postDelayed` in Android requires additional effort.
To achieve it we came up with three different methods:

* Use a static inner `Runnable`/`Handler` with `WeakReference` to owner class
* Clear all messages from `Handler` in `onDestroy` of `Activity`/`Fragment`
* Use [`WeakHandler`](https://github.com/badoo/android-weak-handler) from Badoo as a silver bullet

It’s up to you to choose your preferred technique.
The second seems very reasonable, but needs some extra work.
The third is my favourite, obviously, but it require some attention as well -
`WeakHandler` should not be used without hard reference from outside.
