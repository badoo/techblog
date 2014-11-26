---
layout: post
title:  iOS Code Injection
author: Miguel Angel Quinones
date:   2014-10-26
categories: ios tools
---

Code injection is a powerful tool to modify compiled applications at run-time. It's possible to do on iOS and it can help in many situations. It's not such a widespread technique so I want to talk about it and give some tips on how to use it.

Wikipedia's definition:

> Code injection is the exploitation of a computer bug that is caused by processing invalid data

Sounds very daunting and hacky. And it is in many ways. But it can be a great tool that can save developer time and happiness.

#Why code injection?

On iOS we have to deal with recompile-launch-navigate cycles every time the developer makes a small change and wants to see it's effects. There are times where this cycle is repeated over and over, specially when prototyping, tweaking UI values, or adjusting design to spec.

We can break this cycle by using code injection, and reloading the affected code without even removing the simulator from the developer screen.

###Tools for iOS
Currently there are two open source tools available:

- [injection for xcode](https://github.com/johnno1962/injectionforxcode)
- [dyci](https://github.com/DyCI/dyci-main)

I prefer dyci because it is simpler and it allows for an IDE-agnostic setup.

###Tips

Good ways to use this tool:

- Prototyping
- Visual debugging
- Pixel perfect tweaks: Paired with my favourite pixel-perfecting app: [Uberlayer](https://itunes.apple.com/us/app/uberlayer/id510139938?mt=12)
- Small UI changes
- If you use dyci, pair it with a file watcher tool (like [kicker](https://github.com/alloy/kicker)) and you have an IDE agnostic setup
- Import dyci using cocoapods only in debug configuration, you don't want this in users' devices.

#Conclusion

Using code injection can be very good for small changes, prototyping and implementing pixel perfect designs. Every iOS developer should consider using at some point.

I recommend using dyci and using it for small changes and for pixel perfect tweaks.

For more information visit an [extended version of this post](http://www.miqu.me/blog/2014/11/23/ios-code-injection/) and also [dyci short overview](http://idevtalk.com/2014/10/27/dyci-dynamic-code-injection.idk)
