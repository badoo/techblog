---
layout: post
title:  Pardon My French - Introducing Chateau
author: Erik Andre & Rich King
date:   2016-04-28
categories: Android
---

Being a social networking platform, providing a great chat experience is at the core of what we do at Badoo. However, the meaning of "a great chat experience" is constantly evolving, and the major chat applications keep adding new features to stay competitive and enhance user experience.

![Chateau Example Screenshot]({{page.imgdir}}/screenshot.png)

It’s the same for us at Badoo, and as we’ve added more and more features to our chat, our existing code base and architecture has struggled to keep up with the demands. What was once clean and well tested code has grown in unexpected ways while accumulating technical debt. With this problem in front of us we were faced with a choice that is familiar to all developers: Rewrite or refactor?.

In the end we opted to rewrite, and our decision was based on several good reasons.

1. The great success of [Chatto](https://github.com/badoo/Chatto) (Badoo’s chat framework for iOS) gave us confidence and a good idea of what we could achieve.
2. During the years since our existing chat codebase was written, several architectural concepts have gained popularity for Android, some of which could greatly help us simplify the code.
3. Our commitment to open source. We are always looking for open source projects to contribute to as well as create and this was a good opportunity to fill an mostly empty niche for Android.

With that decision out of the way there was still many remaining questions. What should our architecture look like? How, when and what should we open source? What exactly did we want to achieve with this project?

## Setting the goals

From the start we already had a pretty good idea of what our internal needs and requirements were. However, since our goal from the start was to make Chateau an open source project, we also needed to keep flexibility and extendability in mind whenever we made a design decision. This was reflected in our design goals:

* **Easy to extend:** It must be easy to add new features (e.g GIFs, stickers, voice messages) without affecting other chat functionality.
* **Easy to integrate:** It should be easy to integrate the framework into your application, independent of the type of backend and architecture used.
* **Easy to understand:** It should be easy to use and work with the code base for someone who is not part of our development team.
* **Easy to test:** Chat has many complex user interactions as well as error cases. Having easy to test code (both using unit and integration tests) is critical to support adding features as well as refactorings.
* **High performance:** The framework must not introduce abstractions or patterns that adds a noticeable performance overhead.

To make this a reality though we needed both the right tools and a great architecture...

## An architecture fit for a Chateau

Even though Chateau was written from scratch it's architecture encompasses years of experience of writing chat components and features for Badoo.

![Chateau Architecture]({{page.imgdir}}/architecture.png)

Since we’ve already adopted the Model-View-Presenter (MVP) pattern in our other applications and it had allowed us to create good testable code, it was a natural choice to use it for Chateau as well. Of course, not all MVP implementations are alike, and we still needed to pick a flavor of MVP (there are quite a few out there in the wild). For more information on what we chose to use take a look at our [documentation](https://github.com/badoo/Chateau).

The other piece to the puzzle was [Clean Architecture](https://blog.8thlight.com/uncle-bob/2012/08/13/the-clean-architecture.html), a concept put forward by Robert C. Martin (Uncle Bob). By applying this principle we divide the application into several discrete layers, where all communication between the layers must adhere to the *Dependency Rule*, dependencies in the code must always go downwards (here the upper layers are defined to be UI and as we work our way down we pass through Views, Presenters, Use cases and Repositories/Data sources).

For us, the main benefit of adopting Clean Architecture was similar to what we gained from using MVP in the upper layers of the app. It allowed us to create discrete components that could be tested individually (using fast running unit tests instead of Android tests). As an additional benefit it also made Chateau very pluggable, in the sense that you can easily replace the data storage, UI or networking with an alternative implementation.

## Lessons learned

Developing Chateau has been a wild ride so far (and we’re not done yet!) but also a lot of fun. Along the way we’ve laughed, cried and learned a lot of valuable lessons, here are some of them.

* Striking the balance between providing a complete hat framework (with UI, caching and networking code) compared to providing something that you can use as a basis for your own custom chat is hard. While it’s it’s nice to have something that is ready "out of the box" you still need to be able to completely swap out parts of the stack (like UI or networking). For Chateau we chose to use the the Example app as our way of providing a full chat experience.
* Learning RxJava at the same time as you are developing a framework that makes use of it can be a challenge and will lead to plenty of refactorings along the way (another great reason to have good code coverage).
* It pays off to plan ahead when considering how your library should be built and used to make sure that the process fits both internal and external needs. We wanted to distribute the libraries using [jCenter](https://bintray.com/kingamajick/maven/chateau/_latestVersion) for external distribution while still including them as a regular gradle project dependency when building our apps (to make cross module refactorings easier). This also involved using [git subrepo](https://github.com/ingydotnet/git-subrepo) to allow the Chateau libraries to be just another folder in our main git.

## What’s next?

At the moment there is still some functionality (i.e UI/View implementations and support for specific backends) that is not included in Chateau itself, that needs to be added or implemented in the application where it’s being used. For the future we are aiming at reducing the amount of code needed to fully integrate Chateau. Ideally we would like Chateau to be an almost drop-in component, given that your chat backend is supported.

We are also working on creating a better testing (or mock) backend that can be used to get up and running with the Example app. Keep an eye on our tech blog as well as the project [GitHub page](https://github.com/badoo/Chateau) for updates.

## References and further reading

* [Chateau GitHub page](https://github.com/badoo/Chateau)
* [Clean architecture](https://blog.8thlight.com/uncle-bob/2012/08/13/the-clean-architecture.html)
* [More clean architecture (video)](https://vimeo.com/97530863)
