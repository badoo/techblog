---
layout: post
title:  Mobile App Testing - Tips and Tricks
author: Alexander Khozya
date:   2016-01-15
categories: QA
---

Our new article is in fact a list of tips and tricks. These tips will help beginners to progress faster while more experienced users will be able to streamline what they know. The article will also be useful for developers, product and project managers, and for anyone who would like to improve both product quality and inter-departmental relations.

You will learn:

- How to make the process of mobile app testing easier in general;
- About particular features of working with the network, with internal and external services, and with the iOS and Android platforms;
- Which process solutions and changes will let you develop faster and introduce a testing culture to your development department;
- About useful instruments and solutions for testing, debugging, monitoring, and user migration.

## How can you improve the testing process?

1. Apply [heuristics](https://en.wikipedia.org/wiki/Heuristic) and [mnemonics](https://en.wikipedia.org/wiki/Mnemonic), since they help you memorise all aspects that need to be considered when testing a feature or an application.
  - A universal set of mind maps for: [test insane](http://apps.testinsane.com/mindmaps), [ministry of testing](http://www.ministryoftesting.com/tag/mindmap/).
  - Heuristics and mnemonics: [I SLICED UP FUN](http://www.kohl.ca/articles/ISLICEDUPFUN.pdf) (my favourite one), [COP FLUNG GUN](http://www.testingdiaries.com/cop-flung-gun-mobile-testing/), [SFDPOT](http://karennicolejohnson.com/2012/05/applying-the-sfdpot-heuristic-to-mobile-testing/), [LONG FUN CUP](https://testingideas.wordpress.com/2014/08/17/mobile-app-test-coverage-model-long-fun-cup/).
2. Screenshots, logs and video are a tester’s best proof-points.<br/><br/>Unfortunately, server communication logs are not as easy to handle as client logs. They are usually added more for the developer’s convenience when debugging communications with server than for the tester’s benefit.
    - Please ask developers of clients and servers to export all server requests and responses into a convenient no-nonsense interface for log viewing. It will become easier to analyse server requests and responses, pinpoint duplicates, and find more convenient ways updating data.
    - For example, a developer may have to re-request the entire profile in order to update only a part of it instead of applying a more lightweight request. In situations where the location of a problem is unclear, a combination of server and client logs can help tackle the problem faster in most cases.
3. You can use test “monkeys” to pinpoint crashes and hang-ups while you yourself are busy with more intelligent functionality tests. The most efficient test method is to combine [test monkeys with telemetry tools](https://app.testfairy.com/projects/12560-vk/builds/2263/sessions/23/?accessToken=f1zJnBwhRcCyaNnosqgFDmfprxI) in order to speed up troubleshooting (with TestFairy, for instance).
TestFairy has recently started supporting iOS as well, but its functionality so far is limited.
  - Android: [Application/UI Monkey Exerciser](http://developer.android.com/tools/help/monkey.html)
  - iOS: [UIAutoMonkey](https://github.com/jonathanpenn/ui-auto-monkey)/[CrashMonkey](https://github.com/mokemokechicken/CrashMonkey) (based on UIAutoMonkey). Sadly, AntEater has been abandoned, and their website returns a 404 error. The last time I used it, I fixed bugs and made updates for iOS8 myself ([in case you are interested](https://dl.dropboxusercontent.com/u/10300197/anteater-0.6.0_modified.zip)) . The developers weren’t not prepared to release the source code to open source, even though we kept asking them.
4. If you want to feel more confident before a release, you can use a beta version as a back-up network. Having two or three specialists will certainly not be enough to cover all combinations of cases and various devices (particularly for Android), and in this case you’ll be able to get help from beta users worldwide, which will lessen the workload on the test team. I highly recommend using a TestFairy wrapper for a beta version.
  - Android beta programme is better than its iOS equivalent in this respect: you can invite users via Google+ or accept invitations from them. The number of beta users is not limited.
  - iOS with TestFlight (bought by Apple) has some artificial limitations: a maximum of 2,000 users and a mandatory review of the first beta version. Distribution services can be used for beta software as well.
5. It is a good idea to get a debugging menu with functions that make life easier for developers and testers (especially for the automation team). Functions can include simulating responses from a server, opening certain users, setting particular flags, cleaning and losing sessions and clearing caches. Our mobile applications feature a multifunctional debugging menu, and I quickly reached a point where I couldn’t imagine doing manual or automated testing without it.
6. The developer menu in iOS and Android really is your best friend, and you should switch it on for [iOS](http://apple.stackexchange.com/questions/135382/developer-option-is-not-available-under-settings-menu-why) and [Android](http://www.askvg.com/tip-enable-hidden-secret-developer-options-menu-in-google-android-mobiles-phones-and-tablets/).
In iOS it can do the following:
  - Enable [Network Link Conditioner](http://nshipster.com/network-link-conditioner/);
  - Enable traffic and power usage logs;
  - Test iAd ads in a more convenient way.
  <br/><br/>Android options are even better, featuring multiple settings for any demand, from showing CPU and RAM utilisation to changing interface animation speed.
7. If an application supports both portrait and landscape format, you should pay close attention to screen orientation changes. These can result in crashes, memory leaks and returns to the previous state.
8. Switch between screens many times.
  - For iOS, you should check for the following: memory operations work correctly (to prevent access to wrong memory areas,and prevent updates to screens that are already hidden) and memory leaks.
  - Memory leaks are possible in Android, as something may have locked up the previous activity.
    
    It’s a good idea to switch screens while the application is interacting with the network:
    <ul>
    <li>Incomplete requests should be cancelled;</li>
    <li>Server response to an invisible (i.e. deleted from the memory) screen should not crash the application.</li>
    </ul>
    
9. Don’t overlook testing on [emulators](http://developer.android.com/tools/devices/emulator.html) and [simulators](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/iOS_Simulator_Guide/Introduction/Introduction.html) – those are really convenient and make some test scenarios easier.
In iOS, for example, this makes testing location changes, background location updates, hotkey memory warning simulations and slowed-down animations much easier. In Android, you can configure exotic hardware settings: screen resolutions, pixel density, RAM size, heap size, and internal and external memory size.
10. Fill up the device RAM before launching an app. Firstly, it will let you run a stress test and check operation speed. Secondly, it will let you check that you can save and resume the app state (i.e. where do we return when the app was minimised? Will all the required services run?).
11. Run the app with debugger connected. Why?
  - Chances are that you will achieve enlightenment :)
  - It enables slow stepping through the app, which can sometimes reveal bugs.
  - If a crash or exception happens in an app, it will stop on a breakpoint, and you will be able to ping the developer and debug the issue right away.

## Working with networks

1. An app should operate in a stable manner under the following conditions:
  - When the connection is not stable;
  - When the connection is down;
  - When the connection speed is exceptionally low (1-2 Kb/s);
  - When there is no response from the server;
  - When the response from the server is wrong (i.e. it features errors or rubbish);
  - When the connection type changes on the fly (eg Wi-Fi—3G—4G—Wi-Fi).
    
    Use “problems with network” case chains to the full, using:
    
    - Customised router firmware. The [Tomato](http://www.polarcloud.com/tomato) firmware for the Linksys WRT54G used to help me a lot. The router was dirt cheap, and this firmware let you set the required Wi-Fi speed on the go, without losing the connection with the devices;
    - Proxy;
    - [WANEm](http://wanem.sourceforge.net/);
    - [Network Link Conditioner](http://nshipster.com/network-link-conditioner/) can be easily installed on your Mac, and is built into iOS in version 6.0 and higher. It can shape the traffic and distribute it via an access point on both on an iOS devices and on [Macs](http://appletoolbox.com/2011/11/using-your-mac-as-a-wireless-access-point/);
    - With Android, you can use preset connection speeds in an emulator, or tweak settings manually using [netspeed](http://developer.android.com/tools/devices/emulator.html#netspeed).
    
2. If you needs a proxy server, the easiest solution is [CharlesProxy](http://www.charlesproxy.com/) (it features manuals for devices and emulators on iOS and Android, supports a binary protocols, rewriting and traffic throttling, and, in short, is [worth every penny you pay for it](http://engineering.hoteltonight.com/charlie-and-me-testing-native-mobile-apps-with-charles-proxy)) or [Fiddler](http://www.telerik.com/fiddler) (this one is free).

## Working with application data, internal and external services

1. If there is a third party service, it will definitely fail. A recent FB failure affected the performance of some applications and websites. You should detect as many such issues as possible in advance, and think up ways of eliminating them: to anticipate processing of unexpected responses (errors, rubbish, lack of response, null responses) from third-party services and provide feedback about an issue, to add time-outs to necessary requests, etc.
2. If you have third-party libraries, they will definitely cause problems. Twitter, PayPal and Facebook SDK do have bugs. One of the Twitter SDK versions, for example, used to crash when it received error 503 from its own back-end; the library would just crash and cause the application to crash in turn. It’s not uncommon for the Facebook SDK to crash in Android (you can sometimes spot com.facebook.katana process in crash alerts).
3. URI and data parsers should consider all possible unexpected situations possible; there have been cases when an automatic file and/or URI validity check stopped working on the server side, and the applications had to collect information the hard way. Examples:
  - A 404 error is returned in HTML format;
  - A null response is returned;
  - The server responds to an API request with a standard web-server stub (“It works!” in the case of nginx);
  - A null data structure is returned (JSON, XML, PLIST);
  - A wrong data structure was returned (HTML instead of XML);
  - An invalid URI or an URI with a wrong direction is returned.
    
    In all these cases, an app may fail to parse an unexpected response and crash.
    
    Apart from working on the application stability, in the aforementioned cases it’s important to give the user some visual feedback: an alert, a toast notification, placeholders instead of data, etc.
    
4. If your app updates data by static or easily-formed URLs, then you can use Dropbox or Google Drive in cases where the server logic is not ready or being tuned up. Uploading and updating files directly on the device is not very pleasant. So here’s what we did:
  - We made all URLs configurable and set them to a separate entity, so that a team of developers or testers could easily reassemble apps with particular URLs for updatable data;
  - In addition, we changed all the necessary files and substituted them for the existing ones (manually or by means of the easiest scripts). It’s possible to write another script to rollback to the previous version, writing reference files (you can also use file versioning as provided by Dropbox).
5. Don’t forget to check data and cache migration when an app is updated. It‘s important to bear in mind that users can skip versions, and that we should check updates of earlier versions as well. For example, in June 2015 the LinkedIn app used to crash at startup: some users were unable to use the app until the new version was released (fortunately, it was released on the same day).

## Android

1. Set customised screen resolutions from an emulator screen: it will help identify layout problems, in case you lack devices or just want to check whether the layout has been written correctly. In addition, you can edit screen resolution and pixel density via ADB and on a physical device, [on the Nexus 10, for instance](http://betanews.com/2013/01/14/android-developers-can-use-the-google-nexus-10-as-a-testing-device/).
2. If the keyboard is overridden (i.e. a custom one is used), pay close attention to this. There are both non-bypassable keyboard errors and logic/graphical errors.
3. [Staged rollout](https://support.google.com/googleplay/android-developer/answer/3131213?hl=en) will easily help you pinpoint problems that can be overlooked while testing a release version: you can do a 5-10% release, monitor graphs and crashes and, if necessary, perform a rollback or a resubmit a fixed version.
4. Use [do not keep activities](http://stackoverflow.com/questions/21227623/whats-the-main-advantage-and-disadvantage-of-do-not-keep-activities-in-android) when testing, and make sure that applications are ready for unexpected finishing of activities, which can lead to crashes or data loss.

## iOS

1. Check whether standard gestures have been overridden. For example, activation of “Universal Access” activates additional gestures that can conflict with those in your app (three- and four-finger gestures, for instance).
2. Also pay attention to third-party keyboards. For example, iOS9 features a bug that results in a crashed app, if [you type text with a third-party keyboard](http://stackoverflow.com/questions/32725926/nsinternalinconsistencyexception-accessing-cachedsystemanimationfence-requires) in a WebView modal window.
3. Show the [rollout.io](https://rollout.io/how-it-works/) service to your developers. It lets you patch some crashes in production, redefine parameters, show alerts with apologies and disable certain buttons. It used to save our lives all the time.
4. To perform interactive layout testing or to check that all screens have been removed from the hierarchy, you can use [standard Xcode tools](https://developer.apple.com/library/prerelease/ios/documentation/ToolsLanguages/Conceptual/Xcode_Overview/ExaminingtheViewHierarchy.html) or [Spark Inspector](http://sparkinspector.com/), [RevealApp](http://revealapp.com/).
5. Please ask your colleagues to integrate [Memory Warning](https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/PerformanceTips/PerformanceTips.html#//apple_ref/doc/uid/TP40007072-CH7-SW8) calls into the debugger menu.They are usually assigned to a particular gesture (tapping with several fingers, pressing a status or navigation bar) or [to volume control buttons](http://www.vinnycoyne.com/post/55595095421/ios-simulate-on-device-memory-warnings). You need to check appropriate app behaviour after a Memory Warning — does it clean up used resources, and if so, is it done properly?
  - For example, we had a nasty bug where our Image service would offload a picture from RAM after a Memory Warning, so the user got to see a placeholder instead.

## Debugging processes

These tips will help you make progress with mobile apps testing faster and teach you how to bypass hidden pitfalls in communication with developers.

1. Introduce a Pre-QA culture. Prior to sending a ticket to be reviewed, take a seat next to the developer, at their computer, and test the feature with debugger connected for 5-10 minutes. The majority of the silliest mistakes will show up immediately. This will also teach developers the basic testing skills: at worst, they will carry on doing what you showed them to do; and at best, they will dig deeper and start testing more responsibly. No one wants to make silly mistakes in public.
2. Take at least a quick glance at diffs in every branch/feature, and ask developers as many questions as possible.
In this way, you increase your authority as a tester: it shows, you are trying to understand the code and areas that are relevant to this feature. To this day, developers sometimes still see mobile app testers as monkeys who just poke at phone screens and juggle with devices to make the app crash. _If there are no developers available, you can act as a reviewer. Sometimes a developer, while explaining how a feature works, finds bugs or cases they failed to consider._
Secondly, you will gradually learn the programming language and get a better understanding of what’s going on under the hood of the application.
3. Study the lifecycle of entities in the app (Activity for Android [1](http://developer.android.com/reference/android/app/Activity.html), [2](http://www.vogella.com/tutorials/AndroidLifeCycle/article.html), [3](http://www.codelearn.org/android-tutorial/android-activity); ViewController for iOS [1](https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/TheAppLifeCycle/TheAppLifeCycle.html), [2](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/), [3](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIViewController_Class/)) in order to understand the states into which an app screen and the app itself can transition. The better you know the application/ecosystem from the inside, the better you will be able to test it.
4. If you have apps for iOS and Android, it is important to keep the right resource balance during testing.

Bugs in applications can result in re-submission, which have predictable consequences. Also be aware that the cost of errors is often lower on the Android platform.

  - Android features [staged rollout](https://support.google.com/googleplay/android-developer/answer/3131213?hl=en). You can re-release an Android application the same very day, or even roll back a staged rollout (up to 50% can be completely rolled back to the previous version). But you shouldn’t re-release too often: since users will start complaining and might give you bad reviews.
  - For iOS, the best way of resubmitting is via [expedited review](https://developer.apple.com/support/app-review/) (you should definitely not abuse this). The application will be re-released:
  - on the same day at the earliest (it usually goes to “in review” on the same day, but won’t be “available for review” until the next day);
  - at worst (if expedited review is not allowed) it can take 5–10 days.

On the otherhand, iOS applications are faster to test, since their ecosystem is not as fragmented as Android’s is.

## Miscellaneous

1. What if the worst happens when you least expect it, and a non-stable version of the app gets into production? We use a system of update screens to speed up user migration. Such a system can be useful in the following instances:
  - In the case of a critical bug that gets overlooked during development and testing;
  - when we need to update an application to the required version quickly in order to:
         - launch the feature on all platforms at the same time (it’s also helpful in cases where changes break backward compatibility);
         - to get faster more consistent A/B testing;
         - to take pressure off server teams who have to support outdated API versions because a number of users keep using (very) old app versions.
   
   ### Our update system operates in two modes:
   - **Soft update**, where the screen features “Update” and “Skip” buttons. The screen can be hidden for 24 hours. Also, in this mode you can ask users to enable automatic iOS and Android app updates in system settings, since some users disable automatic updates.
   - **Hard update**, where the screen shows only the “Update” button, leading you directly to the app’s page in a store.
   
   Not all users are physically able to update apps, so this method will be intentionally disabled in some versions or for some cases. iPhone4 users, for instance, will not be able to upgrade to iOS8, and we are planning to stop iOS7 support of the app.
2. We need to monitor the following key application metrics on production:
  - *Daily/monthly/*… active users graphs in order to respond to emergencies faster;
  - Systems to collect and analyse crash logs: [Crashlytics](http://try.crashlytics.com/) (now part of Twitter Fabric), [HockeyApp](http://hockeyapp.net/features/), [Crittercism](http://www.crittercism.com/), [BugSense](https://mint.splunk.com/) (now part of Splunk);
  - User feedback systems via an app (built-in feedback forms or email submission) with a way of attaching device descriptions and screenshots;
  - Application usage statistics ([GoogleAnalytics](http://www.google.com/analytics/mobile/), [Flurry](http://www.flurry.com/), [Splunk](https://mint.splunk.com/), [Heatmaps.io](https://www.heatmaps.io/), [MixPanel](https://mixpanel.com/));
  - Digests of downloads, feedback grouping, finding out whether an app has been featured somewhere ([AppAnnie](https://www.appannie.com/), bought by Distimo).
3. Sometimes only users with particular devices, or in particular countries, experience errors. Vodafone UK, for instance, had issues with WebP-images. You can use cloud-based device rental solutions to check cases like these: [DeviceAnywhere](http://www.keynote.com/) (paid service), [PerfectoMobile](http://www.perfectomobile.com/) (paid service), [Samsung Device Lab](http://developer.samsung.com/remotetestlab/rtlDeviceList.action) (free service, but features a system of credits that can be replenished over time).
4. In addition, you should bear user time zone and location in mind. It well may be although your app is not intended to work in some countries, it have been released there by mistake, or perhaps the app user moved to another country. In iOS, location can be faked in simulator settings (Debug > Locations); there are also Android applications [that let you do the same thing](http://www.phonearena.com/news/Heres-how-to-easily-fake-your-GPS-location-on-Android_id62775). If an application works with some data, and there are several data centres in different time zones, you should make sure that everything works properly and that there are no collisions when users switch data centres while travelling.
5. You should learn to update and downgrade firmware, since platforms are fragmented (Android and Blackberry in particular). Cloud-based services are good, but they cost money, and not every company can use them because of budgetary constraints or security policies.
6. So you’ve detected a bug after releasing a feature, and need to re-release the new version?
Enabling, disabling, and modifying features on the go will help you. You can disable many features in our apps directly from the server depending on the company’s decision, via a dedicated interface.

## Conclusion
Such a list of tips, approaches and tools can be useful for both for beginners and advanced testers of mobile apps. I hope that developers and managers alike will find something useful here for them as well.

When we were compiling this list, we were guided by our own experience, and we’d love to hear your opinion, which you can send us via comments below.
