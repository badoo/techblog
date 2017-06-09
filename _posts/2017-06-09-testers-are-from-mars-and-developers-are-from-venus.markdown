---
layout: post
title: Testers are from Mars and Developers are from Venus!
author: Sunav Sodhani
date:   2017-06-09
categories: QA Mobile-App
excerpt: Although the title of this article is hugely inspired from John Gray’s original work, it essentially denotes a similar relationship between two different entities and them complementing each other to be successful. By means of this post I would like to share my thoughts about the role and responsibility of various teams in ensuring product quality.
---
<img class="no-box-shadow" src="{{page.imgdir}}/4.jpg"/>

Anyone who has ever been a part of any software company in any domain (internet, telecom, enterprise, etc...) would easily attest to the title of this article. :-)
Although the title of this article is hugely inspired from <a href="https://en.wikipedia.org/wiki/Men_Are_from_Mars,_Women_Are_from_Venus">John Gray’s</a> original work, it essentially denotes a similar relationship between two different entities and them complementing each other to be successful.

Hi, I am Sunav and in my limited experience of around 8.5 years as a tester, I have worked with a world class team and built products used by millions today. By means of this post I would like to share my thoughts about the role and responsibility of various teams in ensuring product quality. Some examples mentioned in the later part are real-life examples from my current work place. After reading my post, feel free to share your story with me!

# Defining the Common Goal

What exactly is a company? It is a group of people working towards a common goal while managing different pieces of it. But for a product or a company to be successful it is imperative that all of these pieces are following a pre-determined pattern, or what is also known as a blueprint. Only then, can it achieve its goals like revenue targets, user acquisitions, etc.

Often, in companies consisting of extremely competent teams (like Badoo), where each team takes the onus of product quality very seriously, there are bound to be differences of opinion. Because each individual or team thinks that it is they who have the best interests of the product in mind, they sometimes tend to disagree with other teams, who may be thinking exactly the same thing.
For example, here’s a scenario which gives a bad user experience but doesn’t affect the business perspective very much. The UX guy is not happy but the business person is Ok in this case. Both think they have the best interests of the product at heart, and yet they disagree.

## Why Testers are from Mars

Take testers for example. We think that we are the last line of defence there is and it is our utmost duty to prevent bugs or feature breaks to get into production. So, we are extremely possessive about each and every bug (however big or small) that we find during various testing cycles.
To us, perfectionism is the key, and therefore we end up arguing or debating before rejecting or closing any bug that we deem important, but the developer or product managers might have a different opinion.

## And Developers from Venus

Similarly, developers are extremely passionate and protective about their code, since they consider it as their baby (and obviously no one likes to hear about the faults that someone else may point out in their baby).
Also, because the code is theirs, the developers may sometimes have only one point of view - i.e. trying to use/test/deploy the code in a certain way because they know that that IS the right way. However, the testers’ approach is a more holistic one.

I believe that by being strict with our own code (wide code coverage, better unit testing, etc.) we are only helping to reduce 'tech debt' that could prove extremely costly in the long run.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

## Why do Mars & Venus need to get off their orbits and create one common Orbit?

Therefore, it is imperative that the responsibility for the quality of the product should NOT lie with just the QA/Testing team but with all teams involved.

Also, even though traditionally QA is considered the final gatekeeper (which I believe is wrong. Read <a href="http://www.satisfice.com/blog/archives/652">James Bach’s Blog</a>), there are many other gates where bugs can be identified, fixed and stopped from propagating to further gates.
In a fast-paced product team where the goal is delivery speed, we as testers are only here to provide valuable, timely information about the state and risks of the product.

At Badoo, both development and testing are done following a git branch strategy.
A feature covers all the stages starting from Feature Branch -> Integration Branch -> Release Branch (see more on <a href="{{page.imgdir}}/BMA.png">GIT flow here</a>).

This strategy helps us to release at least weekly(for mobile apps), and also if any feature is not complete for any reason, we always manage to get the rest of the important features to our users.

### Some of the basic, yet most important  points for a tester  at Badoo are:

- Providing Testing Estimates in each ticket . This makes the testing time clearly visible to the developer, product owner and everyone else involved.
- Taking part in PRD (Product Requirement Document) reviews as soon as the document  is written by the Product team. Understanding the business side of a story, doesn’t only help to find issues early, but sometimes, it stops them from even appearing. In this way, we try to give timely feedback to the PRD owner about any other areas that might be impacted by this new feature
- Being involved in regular meetings where the feature gets discussed, as that helps QA to gather information and understand the non-functional aspect of a product/feature better.
- Informing developers and leads about risks and the state of the product under test, as early as possible.

<br>

### Shifting the responsibility for quality towards Developers

Also, considering that delivery speed is a primary focus of this company, we are also seeing that responsibility for quality of deadlines is increasingly being shifted towards developers. And we as Testers help them to achieve this speed of delivery.

We had a flag in our Jira flow where a developer can mark a ticket with QA=YES or NO. We see now that more developers have started marking their tickets as QA=NO. Selecting this in the feature branch claims that developer has tested the feature by himself.

This is challenging for a team but maintaining close interaction with QA and making use of their support makes this achievable. The developer takes full responsibility for this feature until it is released and even post release, checking graphs and performance of this feature.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

One important question here is : Can/Should a developer mark every ticket as QA=NO?
The answer is, usually 1 story point tickets are with QA=NO (*story points are complexity and 1 story point is a fairly small ticket, like a new feature or a modification of a smaller one*).
Badoo also has important features which include payments. Tickets which touch the payments part are more crucial, so we don’t follow this strategy there. Basically, we take this decision only after checking the criticality of each feature.

One of the interesting examples in recent days was when we were in the process of creating the weekly Release branch and business wanted a very urgent feature in the same week. The developer used a good approach to handle this task. Since we were in the middle of testing other important things and even though this ticket was QA=NO, for current one we would have to test all the remaining tickets that were in master already. So, the developer decided to do this ticket as a release ticket for previous release. He also did this with QA=NO.

This approach by the developer allowed us to do only basic checks for already submitted release and not do a full regression. So, we played with the feature itself and areas that might have been affected by this feature. The ticket was monitored post release, and the feature was rolled out to our users, and there were no major bugs.

This really gave everyone a boost of confidence that when needed, Developers and Testers can work closely together and get a business demand roll-out to users really quickly.

<br>

### Being open to try a different work strategy, even if it doesn’t work well

A few months back, we decided to develop a new feature and follow a new branch strategy for it. We called it an Umbrella branch.
So basically, all the developers in the team working on that new feature were supposed to push their code to a single umbrella branch. This umbrella branch was not allowed to be merged to the regular Dev branch until the feature had been completely tested. It was thought that this approach would be convenient for developers, as they can work in parallel and share their code fast.

After a week of development, the testing team was informed that they can start testing the umbrella branch. And from that point, we started seeing more cons rather than pros in this strategy.There was no way to raise an Issue because even if a tester opened a Jira ticket, the fix was done in the Umbrella branch only and not on that ticket. So, it was not easy to keep track of issues. Yes, we used Google spreadsheets to track the status of those issues.

Also, at one point it was a bit difficult to understand that a certain bug is caused depending on which developers commit in this Umbrella branch. A commit pushed by one person was breaking a working functionality of another developer.
After testing this umbrella branch, as a testing team we later informed our leads about all these problems and risks of using the Umbrella branch strategy, and left the decision to them. We released one feature working on this strategy but later decided to stop using it and rather continue following our regular Git branch strategy.

<br>

### Asking the testing team to stop being a Client-Server communication channel

A lot of testers who read this section, will easily relate to it because they often spend a good amount of time in figuring out if a particular issue is client side or server side. I must say that no doubt it’s quite interesting to find out the root cause of bugs which we find, but we have also realised that this is not the good approach to follow in the longer run.

Our testing team has been doing this for ages but we are now trying to change this strategy. We decided that all client side testers should stop exploring the server tickets. Basically, in some cases a tester detects quickly and easily exactly where the problem is, but there are times when instead of putting in time to test our client side feature, our time was consumed much more by analysing server logs, protocol requests etc. One of the other reasons here was to improve the communication between client and server developers. A communication which could have happened quite fast between these two people, takes a lot of time when a tester acts as a middle man. A tester may not completely understand the problem or its explanation and add partially wrong information to the ticket which makes the debugging harder.

To be honest, applying this approach will take time, and it may be even slow down your process at the beginning. But in the longer run, we forced ourselves to take this decision and we are making our managers explain the effects of it.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

# Conclusion

Lastly, what we all need to acknowledge and appreciate is the fact that each one of us has only the best interests of the product in our hearts and minds. We all share a common target to achieve business goals speedily and deliver a quality product to our end users. And it is only by collaborating in a healthy and productive way that we are going to take the company forward in the right direction.
In the end, it is never about who is right or wrong, as long as we all achieve the success that we are gunning for together.

**Sunav Sodhani - Android QA Engineer**
