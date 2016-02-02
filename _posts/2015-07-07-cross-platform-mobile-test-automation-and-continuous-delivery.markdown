---
layout: post
title:  Cross Platform Mobile Test Automation and Continuous Delivery
author: Sathish Gogineni
date:   2015-07-07
categories: qa
---

Badoo develops multiple products with native applications on all major mobile platforms - Android, iOS, Mobile Web (HTML5)  and Windows. Our most popular product, called Badoo, has 250M+ registered users worldwide.

With all our apps on a roughly two-week staggered release schedule, as QA, we would always be doing regression testing on at least one of the platforms at any given time. This requires a lot of manual hours and is a time-consuming job.

So three years ago we started a mobile test automation project at Badoo.

In the beginning, we focused on just the Android and iOS applications. Choosing a tool was a major challenge as there are many mobile automation tools available, each with its own advantages and limitations.

Our first tests were written with Robotium for Android and Kif for iOS. But after writing a few test cases, we realized that most of the business logic was shared across both platforms.
Most platform-specific differences were in the actual application interactions.

This motivated us to experiment with cross-platform test automation tools. Later, once we had proven their success, we extended support to include Mobile Web.

#Why Cross-Platform Test Automation?

- Reusable code between different platforms
- Clear separation of test logic from platform interaction code
- One test case confirms application behaviour is the same across platforms
- Faster development
- Pooled resources

We are using the BDD tool Cucumber, using Given-When-Then format. The test scripts are written in natural language making them readable by anyone.  We use the following open source test tools to support Android, iOS and Mobile web.

- Calabash
- Appium

Our next challenge was integrating the test automation project with our CI processes. We are now running a smoke test suite on every feature branch, as well as nightly system tests, to detect issues early in the development process.
We have scaled up from running on a single Mac machine to using a distributed build system. We also had a cabinet built to display all the test automation devices connected to our build agents, running our test automation suite round the clock.

Test automation has helped us to achieve

- Faster and more frequent releases
- Early bug detection
- More stable applications

If you’d like more details about Cross-Platform Mobile Test Automation (and Continuous Delivery as well!) check out my video presentation.
It’s from when I was asked to be a speaker at Codefest, one of the biggest testing conferences in Russia, and share my experiences of testing at Badoo.

<iframe class="video" width="560" height="315" src="https://www.youtube.com/embed/N0hYSHmRJTQ?list=PL8761XQAJnra6yS64aAOozaGrQWPAkjEY" frameborder="0" allowfullscreen></iframe>
