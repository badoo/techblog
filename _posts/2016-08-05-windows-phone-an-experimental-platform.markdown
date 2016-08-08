---
layout: post
title:  Windows Phone - an experimental platform
author: Vyacheslav Loktik
date:   2016-08-05
categories: WindowsPhone
excerpt: In this article I will tell you the story of our team - how our Windows Phone (WP) team became an experimental platform, the problems that we faced and how we solved them.
---

In the last three years our team has tripled in numbers, and is now newly focused on becoming the company’s experimental platform.
In this article I will tell you the story of our team: how our Windows Phone (WP) team became an experimental platform, the problems that we faced and how we solved them.

We have created really useful solutions that have helped us implement 104 new features (including A/B/C/D tests) in the last 6 months, with only 6 people in the team.

**Warning!** Knowledge and solutions from this article might affect your workflow.

# Reborn

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

Most companies don't support the Windows Phone platform because Windows Phone’s market share is much smaller than iOS and Android.

However, Windows Phone is the third largest mobile operating system on the market. And in our company it has been there from the beginning. But not much attention was paid to it, compared with iOS and Android.

We had an outdated application based on Silverlight and for a long time we had no dedicated team for this project.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

In 2014 Timur, a great Windows Phone developer, joined the company to support the app and my role was to test it.

We discovered that the code needed a lot of work which meant changing the whole application structure.  A lot of time was spent supporting it and so we decided to write a completely new application.

## Reborn: part 1 “Hot or Not”

<img class="no-box-shadow" src="{{page.imgdir}}/3.png" style="float:right; width: 30%; margin-right: 10px;"/>

Our new project was called Hot or Not, a similar app to Badoo but much simpler.
Timur and I made the entire Hot or Not application in just three months, with just one GIT branch which was eventually merged with the Master branch and we also used TeamCity as a build machine.
Every change that was made by the developer to the GIT branch was automatically built as a new version of the application and we knew the history of these builds.

## Reborn: part 2 - “Return of the Jedi”
After a couple of Hot or Not releases, we started to build a brand new application of Badoo.

Having previously done some work for Hot or Not, we decided to make two applications with a shared core in the same GIT repository (in the same Visual Studio project).
We had the opportunity to develop two mobile applications at the same time. However, in such a scheme, any mistakes that were made on Hot or Not automatically transferred to Badoo and vice versa.

This doubled my workload and responsibility because the functionality was different and the bugs behaved differently. We were still supporting Windows Phone 7 and 8, and because of Visual Studio specifics it was like having two completely different applications.
Have you ever tested four mobile applications at the same time? I can tell you it’s not easy!

It was finally time for us to improve our own workflow! First of all, we took a look at our huge mobile client teams and thought about the GIT flow that was used on iOS and Android teams; it’s what we call a huge system.

<br/>

### Git flow

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>

In the beginning you have two branches: Master and Dev.

**1st step - Feature Branches Testing**
The Developer implements a new cool feature in a new branch that was created from the Dev branch. He resolves it and passes to QA.
If the Tester finds a bug, the task is reopened and the developer fixes it. When the task passes QA, this feature branch merges back into the Dev branch.

**2nd step - Integration Testing**
Thus, 5 to 10 feature branches are merged into the Dev branch. The Integration branch is then cut from the Dev branch. During this stage we are looking for bugs caused by integrating features with each other.
Bugs found will be rated as high priority and fixed. When all tasks have been tested and the regression testing is finished, this branch merges into the Dev branch, and then into the Master branch.

**3rd step - Release Branch**
Imagine you have five integrations in your sprint: this means that 50 tasks will go live in the next release and you will need time for release testing.

Release branch is cut from the Master branch and this step is quite similar to Integration testing, but in this case you have all the tasks from release. When each of the 50 tasks passes QA, release testing is done, and you’ve released a new version of the application, and the release branch merges into Dev and then into Master.

However, the fact is that GIT workflow only works well for big teams while we only had two people in our team.
We started to rethink this and figured out two main restrictions that our best flow should have:

- **QAs must not block developers and vice versa.**
We shouldn’t block each other or have to switch to different tasks because this creates a situation where only half the team is working.
- **Each task must be tested several times** (ideally by different people).
Two stages of testing were enough in our case.

We concluded that the best flow for us will be a typical GIT flow without one of the testing steps. We simply removed Feature Branches testing and named it Windows Phone flow.

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>

With such a great workflow, we were able to develop a brand new Badoo application in just three months.

Before moving to the second part of my story I would like to take you through some of our experiments.

# Experiments

The best platform to conduct experiments on is the WEB and at Badoo we do a lot of experiments on our desktop website. Why are we able to do that? Because our team can develop and deliver to users really fast.
We do proper continuous integration for our web platform, which means we are deploying new builds twice a day worldwide in under a minute.

But since mobile platforms grow and have a lot of users, our company focus shifted and mobile clients became our major platform. However, this change created problems, because experiments that we’d previously tested on websites sometimes didn’t work for mobile and so our product managers decided that one of our mobile client teams would become an experimental platform.

This left one question: **Who from the WP, iOS or Android team should form this platform?**

## Small number of users

3% of our mobile client users are on Windows phone, but this actually represents hundreds of thousands of users, which means we have enough users to create test groups and conduct experiments. Our experiments aren’t always the usual A/B tests but A/B/C/D tests as well, which is where we have four groups including the control group.

It also means that if we roll out something that doesn’t work, it doesn’t affect the activity of the majority of our users.

## Short review time

Unlike iOS, where the review time from Apple takes up to two days, the Microsoft Store take around 30 minutes to review and only 16 hours till it’s available to download worldwide, according to Microsoft. In my experience, it only took two hours for it to be available in all the main markets.

## No big device fragmentation

WP doesn’t have much device or OS fragmentation compared to Android because of Microsoft’s strict restrictions. Windows Phone doesn’t allow custom versions of their OS, and the type of hardware that can be used in mobile devices running their OS has to comply with their minimum specs.
This is why we have much fewer device- and OS-specific bugs.

<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>

The Windows Phone platform was made after iOS and Android platforms were launched. Therefore, one big difference in the Windows Phone OS is their “Metro” design, which is all about tiles. This means that the design is really simple.

Things that were rounded on other platforms are square on WP and there are almost no complex animations, which makes development much easier and faster. On the other hand, it is still a mobile OS with a touch screen, push notifications and other standard mobile OS stuff.

# Revolution

In 2015 a new team member joined us to help speed up the process of implementing even more new features. We then became an experimental mobile platform.
In just one year we went from being an abandoned platform to being the most innovative platform in our company!

Now we implement and test new ideas quickly. If everything goes well and all the metrics go up, this will become a new feature and will be implemented on bigger mobile platforms such as iOS and Android. However, if the new idea fails during testing, our product managers will try to change it and if it doesn't work, it will simply be removed.
In just six months we’ve implemented 104 new features (including A/B/C/D tests).

In the year and a half after we started, we encountered a lot of interesting problems. First of all, we had to implement all the experiments really quickly, which meant we had to optimise some of our workflow processes.

## Stats
If you conduct an experiment, you want results. For us, the only way to understand the impact of a new feature is to collect statistics about it and analyse the results of its performance.

**How do we start?**

We have a dedicated Business Intelligence team that has developed our own statistics tool called HotPanel. Thanks to HotPanel we have a fully configurable statistic tracking device, which meets the requirements from the Product team and we can develop it to fit our needs.

We also use <a href="https://www.appannie.com/" target="_blank">AppAnnie</a> to see our users’ reviews from the app stores and monitor complaints so we can quickly find and fix problems.

After we’ve released the app or feature, one of the most important metrics we measure is the crash rate. If you don't know how it is going, your update may fail, user activity may decrease, and you will not understand whether the cause was crashes or something else.
Thanks to <a href="https://hockeyapp.net/" target="_blanck">HockeyApp</a> we can collect crash logs from real users.

## Go go go
Now that we’ve finally understood the impact of our experiments and know how the features perform (or not), our next step improves the speed with which we implement new features.
To speed up this process you can of course add more members to the team, however it is more effective to improve your current processes.

<img class="no-box-shadow" src="{{page.imgdir}}/7.png"/>

When you test a server-side based application you find bugs. However, it’s unclear if the problem is with the server code or the client code.
During the investigation you will also need to consult the server logs.

To simplify this task, we created a special and very comfortable interface for viewing server logs. You can sort the logs by user ID, device ID, logs in real-time view or the history of logs.

You may have problems preparing test environments or test accounts.

*Example:*

You have to test an email that is going to be sent a week after registration. Your real test will be:

1. 	Register a new account
2. 	Wait for a week
3. 	Receive this email
4. 	Check it
But this is not a productive use of QA resources.

The first thing that comes to mind to solve this problem is to go to the developer and kindly ask him to change something in the database to make the email a bit faster.
But we all know that disturbing developers is not always the best idea. So, to make everybody happy we built a new tool that we called QAAPI, an interface with a lot of API methods.

In the email testing example, QA should just use one QAAPI method to get the email in a second. Our developer Dmitry made QAAPI, but this is a topic for another article.

Usually, the server develops faster than mobile clients, but because of our rapid development and testing pace, the mobile client is sometimes ready even before the server has started working on the task. To be able to develop and test new functionality, the client should somehow get the correct server responses for the new client requests to server.
To do this we created the Server Mock utility - the idea is simple, developers or QA can create a special server environment where they can mock an exact server response on an exact client request.

Also, it helps to test situations when the server is broken, as we can mock any server response.

<img class="no-box-shadow" src="{{page.imgdir}}/8.png"/>

These things are possible thanks to a very good client-server protocol developed by each of the dev teams before client or server development has started.

Sometimes it will be faster to ask client-side developers to simplify your testing by creating some “extra” abilities inside the application, such as:

- Being able to see the client log, sending it via email.
- Opening any screen of the application, which may be complicated because the server controls it, etc...

For such “tweaks” we’ve got a dedicated section in our application, which is called the Debug_menu. You can also clear the photo cache, overall cache or even crash an application and much more.

<img class="no-box-shadow" src="{{page.imgdir}}/9.png"/>

Sometimes people from other teams need test versions of our application for various reasons, like:

- Product manager wanting to check the function of unreleased features.
- Or designers wanting to do a visual QA.
- Maybe a translator wants to install an application to see what the translation text looks like.

To make installing test applications easier, each mobile client team has their own internal app store. This allows us to install test builds in just one click.

## More people
Because developing and supporting  test cases takes a lot of time, we don’t have them.

In early 2016 our WP QA team grew by three additional people, which presented a problem - I had to share my testing notes. The idea was to share all notes that we stored privately on our notebooks which would help us during testing.

We tried lots of software like Google Docs but the main problem was that it’s hard to search files in folders among other docs you may have. We also tried Evernote but it had a serious disadvantage - you have to share each note you create.

As we are the Windows Phone team, we decided to try out Microsoft OneNote. This suits our needs, and it even allows us to deep link to the exact note in native applications! So we started using a shared notebook and created really good testing documentation. We also created a special regression checklist which contains links to our brilliant shared notes. If we had a new joiner today, we would just need to give him this document and it would almost be enough for him to start testing applications properly.

Today, we have a weekly release cycle. Our main and only rule is that our **release branch should be created and tested (excluding regression) one day before release** - this allows us to publish our application for Windows Phone during working hours.

# Conclusion

Being a team of 6 people is an advantage: we’re more flexible and free to improvise and we can take decisions, which is not the case in a big team. The size of your team doesn’t matter, because if you know how to get the best out of each team member and improve your processes, you can reach optimum results.

I hope that by sharing these experiences with you, I can help you and your team solve similar challenges. I’m very curious to hear what you think about our experiment, so please let me know!

**Vyacheslav Loktik, QA Lead Windows Phone**
