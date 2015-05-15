---
layout: post
title:  iOS Code Injection
author: Miguel Angel Quinones
date:   2014-12-01
categories: ios
---

Code injection is a powerful tool to modify compiled applications at run-time. It's possible to do in iOS and it can help in many situations. It's not such a widespread technique so I want to talk about it and give some tips on how to use it.

Wikipedia's definition:

> Code injection is the exploitation of a computer bug that is caused by processing invalid data

Sounds very daunting and hacky. And it is in many ways. But it can be a great tool that can save developer time.

When used as a tool instead of as an exploit, we will be triggering successive recompiles and injecting those into our running app. Then client code inside the app will update the classes and methods, taking advantage of Objective-C runtime.

#Why code injection?

In iOS we have to deal with recompile-launch-navigate cycles every time the developer makes a small change and wants to see its effects. There are times where this cycle is repeated over and over, especially when prototyping, tweaking UI values, or adjusting design to spec.

We can break this cycle by using code injection and reloading the affected code without even removing the simulator from the developer screen.

#Tools for iOS
Currently there are two open source tools available:

- [injection for xcode](https://github.com/johnno1962/injectionforxcode)
- [dyci](https://github.com/DyCI/dyci-main)

*Injection for xcode* has more features and works on simulator. *Dyci* on the other hand is more focused, only offering code and resources injection over to the simulator. Dyci is my tool of choice, given that the library is simpler and allows for an IDE-agnostic setup.

#Use cases

- Prototyping: You can sit with the designer and experiment as you exchange ideas, instead of going back and forth with feedback loops
- Visual debugging: Some visual bugs are hard to find. You can play around with the view hierarchy and change background colors, or even add debug views
- Pixel perfect tweaks: This is my favorite. Pair it with a tool like [Uberlayer](https://itunes.apple.com/us/app/uberlayer/id510139938?mt=12) and you can tweak iteratively till your application perfectly matches your design. All this with your simulator always present on screen
- Small UI changes: Positions and colors? A matter of seconds instead of minutes
- If you use dyci, pair it with a file watcher tool and you have an IDE agnostic setup
- Link against the code injection library only in debug configuration, you don't want this in users' devices

#Conclusion

Using code injection can be very good for small changes, prototyping and implementing pixel perfect designs. Every iOS developer should consider using it.

I recommend using dyci and setting up an IDE-agnostic setup, as described [here](http://www.miqu.me/blog/2014/11/23/ios-code-injection/) in more detail.

<iframe class="video" src="https://player.vimeo.com/video/124328836" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>