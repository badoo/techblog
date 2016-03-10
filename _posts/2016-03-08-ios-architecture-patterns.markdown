---
layout: post
title:  iOS Architecture Patterns
author: Bohdan Orlov
date:   2016-03-07
categories: iOS
excerpt: Four years have passed since our migration from PHP 4.4 to PHP 5.3 at Badoo. It is high time to upgrade to a newer PHP, PHP 5.5. We’ve had many reasons to upgrade, apart from a number of new features, PHP 5.5 has greatly increased performance.
---

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

*FYI: Slides from my presentation at NSLondon are available <a href="http://slides.com/borlov/arch/fullscreen#/" target="_blank">here</a>.*

Feeling weird while doing MVC in iOS? Have doubts about switching to MVVM? Heard about VIPER, but not sure if it worth it?

Keep reading to find the answers to questions above. However if you don’t — feel free to place your complaint in the comments.

You are about to structure your knowledge about architectural patterns in an iOS environment. We’ll briefly review some of the popular patterns and compare them in theory and practice, going over a few examples. Follow the links throughout the article if you would like to read in more detail about each pattern.

*Mastering design patterns might be addictive, so beware: you might end up asking yourself more questions now than before reading this article, like these:*

*Who is supposed to own networking requests: a Model or a Controller?*

*How do I pass a Model into a View Model of a new View?*

*Who creates a new VIPER module: a Router or a Presenter?*
