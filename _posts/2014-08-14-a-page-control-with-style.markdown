---
layout: post
title:  A page control with style
author: Miguel Angel Quinones
date:   2014-08-21
categories: ios
---
When we set up to design the new [Hot or Not](https://itunes.apple.com/gb/app/the-game-by-hot-or-not/id639584030?mt=8) version, our designers and developers came up with a really nice way to hint users that the photos they scroll horizontally, can be seen as a grid.

![animated](https://raw.githubusercontent.com/badoo/BMAGridPageControl/master/demoimages/demo2.gif)

We thought this is rarely done in iOS apps, so we would like to share it with the community. You can find the control [here](https://github.com/badoo/BMAGridPageControl).

Technically, the component is very simple, but we set out to develop it's internal logic in a TDD fashion, so what normally would be implemented as a single class, is actually split into 2, for testability purposes: A control and a driver.