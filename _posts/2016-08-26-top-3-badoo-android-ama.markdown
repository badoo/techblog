---
layout: post
title:  Top 3 Badoo Android AMA
author: Android Team
date:   2016-08-26
categories: Android
excerpt: Our Android team just had their first Ask Me Anything (AMA), it was great! So we’re sharing our top 3 Android question and answers from Dima, Erik, Guillermo, Rich and Yaroslav.
---
Our Android team just had their first **A**sk **M**e **A**nything (**AMA**), it was great! So we’re sharing our top 3 Android questions and answers from Dima, Erik, Guillermo, Rich and Yaroslav.

For those of you who don’t know much about us, our Android app is huge, with 100,000 lines of code, over 100 million downloads on the Google Play store and an amazing team of 17 people who develop it.

Having an <a href="https://www.reddit.com/r/androiddev/comments/4wx1yy/were_the_badoo_android_engineering_team_ask_us/" target="_blank">AMA on Reddit</a> was a great opportunity for people to ask any technical questions about developing android apps on a large scale, the technical challenges we face at Badoo, our <a href="https://github.com/badoo" target="_blank">Open Source</a> projects, articles on the blog and anything inbetween. Let’s get started!

<br/>

# Top 3

**<a href="https://www.reddit.com/r/androiddev/comments/4wx1yy/were_the_badoo_android_engineering_team_ask_us/d6apq1z" target="_ blank">GreyAgency</a> wanted to know what was the craziest device-specific bug we've had to deal with?**

**Guillermo**: Won’t mention the vendor, but we have a xxxSafeTextView and xxxSafeEditTextView, so we do not crash on setEnabled. We even have a custom Lint check for that :)
<hr/>

**Erik**: There was this one device (once again, not naming any names) where classes from the support library had been compiled into the Android framework. So if your support library version did not match the built-in one you would get a preverify error. Good times!
<hr/>

**Rich**: I can’t remember the exact issue, but we had a crash that occurred on a small number of devices which was related to the framework logging on these devices causing an IllegalArgumentException.
<hr/>

**Dima**: A long time ago (when Dalvik was reality and ART was in preview) one vendor decided to release a phone with ART enabled by default. We had lots of fun with tweaking our obfuscation/optimisation tools untill the app stopped crashing in random places.

## tl;dr

There are always going to be small (and sometimes large) issues with third party implementations of Android. The best thing to do when you discover something like this is to raise the issue with Google to get a test added to the CTS (Compatibility Test Suite) which is part of the Compatibility Program (this obviously doesn't solve the issue, but fixes it for the future).

Unfortunately, there are always going be compatibility issues with  third party implementations, but that's the price you pay for a more open system.

<br/>

# Top 2

**<a href="https://www.reddit.com/r/androiddev/comments/4wx1yy/were_the_badoo_android_engineering_team_ask_us/d6al5iu" target="_blank">dancing_dead</a> asked “How long does a full build take?”**

**Erik**: Too long (builds can never be fast enough)!
<hr/>

**Yaroslav**: A full clean build takes about 5 minutes (on my MacBook Pro, 13-inch, Early 2015) and about 1 minute for hot build. It’s too long, so we try to minimise the number of times we run full builds per developer. That’s why we have CI which runs all the tests for us and builds the different app flavours somewhere in the cloud.
<hr/>

**Guillermo**: In an attempt to reduce our build time, some of us have explored alternative techniques. I myself explored <a href="https://buckbuild.com/" target="_blank">Buck</a> as a build system.
This was developed by Facebook to address some of the limitations we start to face now - and it looks very funny when it runs! It promises high speed builds, with some tradeoffs such as changing the way you think of modules and dependencies. Since it is just a build system, it does not do dependency solving for you, something that can become a bit annoying in big projects.
There is a Gradle plugin called OkBuild that promises to solve that for you, generating all the buckfiles and inferring all the parameters from your existing Gradle setup, but so far I didn't manage to make it work with our build :(

<img class="no-box-shadow" src="{{page.imgdir}}/1.gif"/>

The good thing is, you can write almost anything you are missing in Python and hook it into the build. The bad thing is, you will have to write a lot of things, e.g. Retrolambda integration.
Conclusions so far: Buck requires quite a lot of changes both in our builds and our coding style, and it is not clear that this will render into big benefits.
<hr/>

**Dima**:
Android build is slow due to 1 main reason: very slow dexing. Unfortunately, almost all we can do is to wait until Google fix this. Otherwise we will be stuck with maintenance of a very complicated tool, hoping that Google won’t break compatibility in each release. We’ve already had these problems in the past and we’ve learnt our lesson.

Should I mention here how slow apk installing on a device is, because of an “interesting” idea to compile dex bytecode into native code on the device itself? It means that we are spending a lot of time converting class files into dex and then again spending time on a device (which is much slower than a PC) to compile dex into native code. In the next android N this should be gone, because they have finally reinvented hot spot.

## tl;dr

Two more answers were added to complete Erik's and Yaroslav's point of view. Guillermo is giving some feedback about his investigation on new alternatives to reduce the build time. While Dima explains why the Android build can be slow.
If you want to share your point of view on this, then just leave a comment - we would love to hear about it.

<br/>

# Top 1

**And the first position goes to <a href="https://www.reddit.com/r/androiddev/comments/4wx1yy/were_the_badoo_android_engineering_team_ask_us/d6akq8k" target="_blank">Neosinan</a> with “What's your advice/tips to new Android developers?”**

**Rich**: The best advice I can give when starting out is to start small. Pick a tiny little app that you would find useful, and then try to write it. This is how I got started. Being interested in the app you’re writing helps you keep going rather than giving up when the going gets tough. There are some great tutorials out there for Android these days. The Google Android Training site is pretty good, I also really like the tutorials Vogella writes as well.
<hr/>

**Guillermo**: Depends on how new you are to Android. If you know how to Java but never ever touched Android, Udacity’s Android course is pretty good and will get you hands-on from the very beginning, something that people eager to learn will appreciate. Make good use of the community as well: there are plenty of podcasts and newsletters you can follow to be up with the latest trends - this applies to more seasoned developers as well! Most of the good stuff is posted to the <a href="www.reddit.com/r/androiddev" target="_blank">Android Dev subreddit</a>, so that is a good place to look up as well.
<hr/>

**Dima**: Learn java, and know it very well. Learn some other programming language, like Closure, Go and Python to see how things can be done using a different approach. Try small things first. Enjoy what you do. It might take hours to start doing something, days to learn Android development, but will take ages until you master it. Just don’t give up.
<hr/>

**Yaroslav**: If you came from a different platform to JVM, I strongly recommend learning Java first. Android is no more than a big framework, so Java knowledge is essential. Once you learn Java (ha ha, nobody knows Java enough), pick any tutorial and create your first “Hello world” application: learn how the project is structured and how to run an Android application from IDE.
At this point the best way to learn is through practice: pick a simple idea and implement it as an Android app, and then try to add more and more features and play with the Android API. A good resource at this point is <a href="https://developer.android.com/guide/index.html" target="_blank">https://developer.android.com/guide/index.html</a>.

Additionally, there are a lot of useful community resources such as podcasts, articles and conferences. Just subscribe to <a href="http://androidweekly.net/" target="_blank">Android Weekly</a> to keep track of the latest news in the Android community.

# Conclusion

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

We hope you enjoyed our top 3 and learned something new about Android development at Badoo. It’s not too late, you can still have a look at all the other questions.

Badoo Android AMA is now closed on Reddit but feel free to drop your questions about Android development in the comment section and we will get back to you with more juicy details ;)

### Badoo Android team

**Dima Voronkevych**<br>**Erik Andre**<br>**Guillermo Orellana**<br>**Rich King**<br>**Yaroslav Heriatovych**
