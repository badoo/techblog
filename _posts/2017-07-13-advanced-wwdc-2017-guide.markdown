---
layout: post
title: Advanced WWDC 2017 Guide
author: Alexander Zimin
date:   2017-07-13
categories: iOS
excerpt: I would like to share my thoughts on the WWDC developers conference. This post should be helpful not only for those who have simply heard about this event, but also for those who have already had a chance to watch some of the sessions. There is a lot of material, so I would advise you to focus your attention on what is of most interest to you.

---

<img class="no-box-shadow" src="{{page.imgdir}}/1.png">

Hello everyone! There are more than 120 sessions from WWDC, do you knw which one to watch? Get instruction on how to watch and check out some short reviews about the talks. Stick with me and I would like to share my thoughts on the WWDC developers conference. This post should be helpful not only for those who have simply heard about this event, but also for those who have already had a chance to watch some of the sessions. There is a lot of material, so I would advise you to focus your attention on what is of most interest to you.

1. What is WWDC?
2. The main points of WWDC 2017.
3. When, why and how to watch the WWDC sessions.
4. Sessions worth watching for every developer.

Let’s go!

## What is WWDC?

***NB*** *If you already know about what’s new at WWDC 2017, you can move on to the description of how to view sessions or to my personal rating of them.*

The WWDC is a worldwide conference for developers on Apple platforms. It has been held since 1983 and recordings of some past talks are easy to find on the internet.
 
For example, here is a Virtual Reality session from WWDC 1995: <a href="https://www.youtube.com/watch?v=6XEDlgtLmAs">https://www.youtube.com/watch?v=6XEDlgtLmAs</a>.

Apple brings about 1000 of its engineers to WWDC to answer developers’ questions and to hold lots of sessions in which they tell you about what’s new in software. These are the sessions I am going to talk about below.

I am thinking you know all this already, so let’s move on to the main points this year.

---

## WWDC 2017

The main things that are new at WWDC are demonstrated during the <a href="https://developer.apple.com/videos/play/wwdc2017/102/">Platforms State of the Union</a> session. This year there were quite a lot of them. I will tell you about the most interesting ones.

- It all began with a demonstration of Playground on the iPad. At Apple they really want you to teach your children to program, especially using their platforms. <a href="https://www.apple.com/newsroom/2017/06/swift-playgrounds-expands-coding-education-to-robots-drones-and-musical-instruments/">You can even program robots using the iPad</a>.
- iOS 11 now only supports 64-bit devices, and applications compiled exclusively for 32-bit architecture cannot be launched.
- Apple has majorly upgraded Xcode (in my view this is its most productive year):

<img class="no-box-shadow" src="{{page.imgdir}}/2.png">
<em>New Source Editor</em>

1. New Source EditorSource Editor, written in pure Swift, has been ported from Playground onto the iPad. It is very advanced now (for example, it supports refactoring in Swift). They have promised to make it possible to add one’s own transformations.
2. Markdown Editor inside Xcode.
3. Over 300 new checks and rules for the compiler and analyser.
4. Speaking about Xcode performance: they have speeded up the file-opening by 3. And now 60 fps when scrolling through lines of code and now jump-to-line action is 50 times faster.
5. The new Indexer is now able to index and build at the same time. Fast Open (⌘ + ⇧ + O) works 35 times faster and Project Search (⌘ + ⇧ + F) up to 50 times faster inside large projects.
6. The new Build System is written entirely in Swift. They are promising to speed up the build of large projects  to make them 2.5 times faster.
7. The new Source Control (apparently not in Swift), integration with GitHub and a whole new tab with various functions (branches, tags etc.).
8. Now when moving a file to the folder inside Xcode the system automatically moves this file into the right folder in your Finder (we lived to see this! 🎉🎉).
9. <a href="https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/debugging_with_xcode/chapters/special_debugging_workflows.html">View Hierarchy Debugger</a> now for SpriteKit and SceneKit.
10. <a href="https://developer.apple.com/videos/play/wwdc2016/412/">Runtime Analysis</a>, which was presented in Xcode a year ago, now has two new types of sanitiser: Main Thread API Checker (for example, a potential UI call not from the main thread 😱) and Undefined Behaviour Sanitizer (for example, signed integers overflows).

<img class="no-box-shadow" src="{{page.imgdir}}/3.png">
<em>Runtime Analysis inside Xcode 9</em>

- The new Swift version, with painless migration process. Also, Swift 3.2 and Swift 4 will work together (via a single toolchain). All the main features can be viewed here: <a href="https://github.com/ole/whats-new-in-swift-4">https://github.com/ole/whats-new-in-swift-4</a>. They are promising to speed up build projects which have mix-and-match of Swift and Objective-C by 40%. And, what’s more, to speed up by a factor of 2 build modules which have <a href="https://swift.org/blog/whole-module-optimizations/">Whole Module Optimization</a>.
- Important changes were also presented in respect of testing:

1. <a href="https://medium.com/xcblog/xcode9-xcode-server-comprehensive-ios-continuous-integration-3613a7973b48">Advanced CI with Xcode Server</a>.
2. Several applications within a single UI tests session (convenient for testing those deep links), and they are promising to speed up elements query tenfold.
3. Remote debugging via Wi-Fi.

- Drag and Drop API with a focus on the iPad. You can see how it works here: <a href="https://www.youtube.com/watch?v=F-QA-qAEMBw">https://www.youtube.com/watch?v=F-QA-qAEMBw</a>. There are a lot of sessions devoted to this API, but it is not relevant to everyone, so I won’t spend a long time on it.
- Dynamic Type for custom fonts. It seems that at Apple they want us to make more accessible applications.
- MusicKit (API from Apple Music for your applications).
- HEVC and HEIF (new format for photos and videos from Apple). It is said that files can be half the size and can be converted back excellently. <a href="https://iso.500px.com/heif-first-nail-jpegs-coffin/">500px guys are already going full out testing this</a>.
- Core ML which allows you to apply deep machine learning models in a single line of code 👾! Of course, it has its issues, but Apple is already giving its API for Language Processing and Computer Vision, opening up the path for new opportunities.
- Metal 2. I am not an expert in this field, but I have heard that Apple has added capabilities for additional optimisations.
- VR and SteamVR for macOS. Apple is also selling <a href="https://developer.apple.com/development-kit/external-graphics/">External Graphics Development Kit</a> for developers.
- ARKit is an augmented reality on iOS. Very cool stabilisation and easy integration with SpriteKit and ScreneKit. <a href="https://twitter.com/madewithARKit">There are some cool examples</a>. The bad news is that it is only for iPhone 6s and higher.

And a couple more changes which are deserving of your attention, although they weren’t demonstrated in the Platforms State of the Union (thanks, <a href="https://medium.com/@dive">Artem Loenko</a> to mention part of them).

- No more own custom ratting windows on your application; use only <a href="https://developer.apple.com/documentation/storekit/skstorereviewcontroller">SKStoreReviewController</a>:<a href="https://9to5mac.com/2017/06/09/app-rating-custom-prompts-app-store-banned/"> https://9to5mac.com/2017/06/09/app-rating-custom-prompts-app-store-banned/</a>.
- MapKit now has a clustering identifier, which allows you to use basic maps comfortably, even if there are too many objects.

<img class="no-box-shadow" src="{{page.imgdir}}/4.png">
<em>MapKit clustering identifier</em>

- Now has NFC support (there are lots of limitations, but if you are interested: <a href="https://developer.apple.com/videos/play/wwdc2017/718/">Introducing Core NFC</a>).
- PDFKit for advanced work with PDF (Hello, <a href="https://pspdfkit.com/">PSPDFKit</a>). <a href="https://developer.apple.com/videos/play/wwdc2017/241/">Introducing PDFKit on iOS</a>.
- <a href="https://developer.apple.com/library/content/documentation/Swift/Conceptual/Swift_Programming_Language/Attributes.html">@available</a> is now also available in Objective-C.
- <a href="https://developer.apple.com/documentation/devicecheck">DeviceCheck</a> has come out: a two-bit flag which is bound to a device.
- In the future we are awaiting <a href="https://developer.apple.com/videos/play/wwdc2017/413/">dyld 3.0</a> which is destined to speed up applications launching.

---

## Watching WWDC 2017 sessions

All the sessions from WWDC 2017 are already available online on the Apple web page: <a href="https://developer.apple.com/videos/wwdc2017/">https://developer.apple.com/videos/wwdc2017/</a>.

The main questions developers are going to ask are: Why should I watch them? How can I select the most interesting sessions? How can I watch everything?

**I will start with the question: do you use weak or strong for IBOutlets? And why?**

The answer to this question is in one of the talks at WWDC 2015. The session is entitled, <a href="https://developer.apple.com/videos/play/wwdc2015/407/">Implementing UI Designs in Interface Builder</a>, and the answer comes at 31:30.

What am I getting at? My point is that the answers to a lot of questions which arise during the course of day-to-day developer work (or for example, some tips and tricks for working with the animation or Core Data), can be found at WWDC. There are lot of sessions full of those sorts of small details which are helpful for any advanced iOS developer.

---

## How to select a session to watch?

- **Watch the talks based on what you are interested in**

In the first instance look out for those talks which are related to your current topic of work. For example, if you work a lot with Core Data, at least try to check sessions about multiple threads, GCD, what’s new in Foundation and Core Data itself. And don’t forget that the sessions contain references to other sessions (and not necessarily from the same year).

- **Make your selection based on rating and description**

A couple of weeks after WWDC a sufficient number of articles will come out in which people will share the most interesting talks. Here are some examples from this year: <a href="https://www.raywenderlich.com/164732/top-10-wwdc-2017-videos">Top 10 WWDC 2017 Videos</a> and <a href="https://useyourloaf.com/blog/wwdc-2017-viewing-guide/">WWDC 2017 Viewing Guide</a>. But it is not worth relying on what somebody else has chosen. For example, this year there were two interesting sessions which didn’t have expressive titles (<a href="https://developer.apple.com/videos/play/wwdc2017/242/">The Keys to a Better Text Input Experience</a> and <a href="https://developer.apple.com/videos/play/wwdc2017/244/">Efficient Interactions with Frameworks</a>). No one talked about them, but nevertheless they are worth your attention.

- **Work as a team**

Share out responsibilities for watching WWDC sessions within your team. For example, if there are five developers, you can each watch 3–5 talks and prepare a mini-presentation on the most interesting points. I like this option best because as you watch the sessions there is time to thoughtfully analyse the details and the slides and notes you prepare can be used later as crib sheets.

---

### How can you watch everything?

Of course, there is no point watching everything. If you watch everything that catches your interest, regardless of relevance, by the time September comes around you will have forgotten everything you have heard. But if you want to watch more sessions than you have free time, the following tips may help you, as they once helped me.

- **Context**. View the slides before watching the session/s. Almost always they sum up the topics of the talk very well (possibly the talk won’t be what you need). Also slides help you to find your bearings: where to find what you are interested in, so as not to have to watch the whole session in its entirety.
- **Speed**. Watch the session/s at various speeds. For example, What’s New is fine to watch at a speed of x1.5–1.7. The same VLC and application from the previous point can handle this. If, on the other hand, you have decided to watch it in Safari, here is a JS script from <a href="https://medium.com/@dive">Artem Loenko</a>:

{% highlight html %}

document.getElementsByTagName("video")[0].playbackRate = 1.5

{% endhighlight %}

- **Relevance**. It doesn’t always make sense to view a session in detail. Possibly you will require the technology mentioned in a given session in September-October, when it will be introduced into your application. If you watch in spurts or browse through the slides, you can get a clear understanding of the subject and can come back to it when you need to.
- **Tools**. Use third-party applications and tables to highlight key points. For example, <a href="https://wwdc.io/">this informal client for viewing WWDC</a> sessions allows you to place bookmarks mid-video, which is very convenient. And you can add comments to a table in respect of the most interesting places in the talk.

---

## Must-watch 2017

This year I watched multiple sessions and have selected the ones for you which all iOS developers need to watch. For the sake of convenience, the talks are divided into the following categories: *Foundation, Lead, UI, Debug, Testing, AppStore, Featured.*

And I have marked my personal favourites with the sign 🍿.

### Foundation (basics)

- <a href="https://developer.apple.com/videos/play/wwdc2017/402/">402 What’s New in Swift</a>

🍿🍿🍿

Basically, this is no longer so much about what’s new in Swift, but about what’s going on ‘under the bonnet’. If you write in this programming language, then you need to watch this talk for your own general knowledge. If you are looking for the distinctives of the new Swift, then go here: <a href="https://github.com/ole/whats-new-in-swift-4">https://github.com/ole/whats-new-in-swift-4</a>.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/244/">212 What’s New in Foundation</a>

🍿

Here studying the slides should be enough, but the new <a href="https://github.com/apple/swift-evolution/blob/master/proposals/0161-key-paths.md">KeyPaths</a> and <a href="https://github.com/apple/swift-evolution/blob/master/proposals/0166-swift-archival-serialization.md">Codable</a> systems are covered exhaustively.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/244/">244 Efficient Interactions with Frameworks</a>

🍿🍿

<a href="https://en.wikipedia.org/wiki/Copy-on-write">COW</a>, work with data, bridging, strings, regular expressions and much more in this under-valued talk.

---

**Lead (if you lead a team and want to create ideal applications)**

- <a href="https://developer.apple.com/videos/play/wwdc2017/238/">238 Writing Energy Efficient Apps</a>

🍿

If your application uses up too much energy, users will delete it. Processing, Networking, Location, Graphics — that is what this talk is built around. However, if you have already dug into this subject, you are unlikely to find anything new here.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/401/">401 Localizing with Xcode 9</a>

🍿🍿

With Xcode 9 a huge amount is automated for the purposes of localisation. The talk discusses problems such as extracting data, currencies and word formation in various languages (e.g. 1 city, 2 cities). If you want to refresh your memory or find out something new, you need to watch this session.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/413/">413 App Startup Time: Past, Present, and Future</a>

🍿🍿

This talk isn’t so much about the present, as about the future. dyld 3.0 is on its way — with all the ensuing consequences. dlopen/dlsym/dladdr/all_image_infos: if you know any of these words, start watching the talk.

---

**UI (work with visual components)**

- <a href="https://developer.apple.com/videos/play/wwdc2017/201/">201 What’s New in Cocoa Touch</a>

🍿

Here again, it should be enough to browse the slides, but be ready for some changes to iOS 11.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/204/">204 Updating Your App for iOS 11</a>

🍿

Following on from the previous talk. At least study the slides.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/219/">219 Modern User Interaction on iOS</a>

🍿🍿🍿

The first part is not so much about new technologies, as about working with gestures on the system and interacting with them. My personal must-watch for those working with UI.

**Interesting fact**: 163 UIGestureRecognizers on a normal iPad settings screen.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/206/">206 Introducing Password AutoFill for Apps</a>

🍿🍿

Obligatory viewing for developers of applications requiring a login. Everyone else needs to know that there are already 25 **kinds** of UITextContentType, and it is worth using them in applications. Especially with the Apple focus in respect of <a href="https://en.wikipedia.org/wiki/Natural_language_processing">NLP</a>.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/242/">242 The Keys to a Better Text Input Experience</a>

🍿🍿🍿

About keyboards. The aim isn’t to sell new API, but to deal with non-standard situations: varying keyboard sizes, on-screen work without tables, the role of input accessory view and the impact of dynamic type.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/412/">412 Auto Layout Techniques in Interface Builder</a>

🍿🍿

Yes, yes, it’s our beloved AutoLayout. Changing layout when an application is working (especially when it depends on context), the role of dynamic type, a new indentation concept (safe areas) and a couple of case studies: working with percentages in layout and how layout depends on display orientation.

---

**Debug (what programmers do 80% of the time)**

- <a href="https://developer.apple.com/videos/play/wwdc2017/404/">404 Debugging with Xcode 9</a>

🍿

In my view, this session is a bit drawn out, but I couldn’t not include it in this list because it has some interesting points, such as the improved work of break-points.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/407/">407 Understanding Undefined Behavior</a>

🍿

If you haven’t yet moved over to Pure Swift, it’s worth watching this talk. It describes the work of Undefined Behavior Sanitizer.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/406/">406 Bugs Using Xcode Runtime Tools<a/>

🍿

What Main Thread Checker, Address Sanitizer and Thread Sanitizer are all about. If you still don’t know what these are, watch the session (or at least browse the slides).

---

**Testing (testing your own application)**

- <a href="https://developer.apple.com/videos/play/wwdc2017/414/">414 Engineering for Testability</a>

🍿🍿

About extracting logic from VC, creating mocks, the role of DI and the importance of output parameters of any kind. There are also a couple of pieces of advice on UI tests. If you don’t write tests frequently, it is worth watching the talk for your general knowledge.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/409/">409 What’s New in Testing</a>

🍿

New distinctive features of tests. Most of the advice relates to UI tests, so no need to watch this unless you have to.

---

**AppStore (if you have your own projects or you are responsible for working with the App Store)**

- <a href="https://developer.apple.com/videos/play/wwdc2017/301/">301 Introducing the New App Store</a>

🍿🍿🍿
You probably know that App Store in iOS 11 has been radically updated. There will be a lot of new features, so you must watch this talk.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/302/">302 What’s New in iTunes Connect</a>

🍿🍿

A lot of attention is devoted to TestFlight. If you spend even just an hour a week on this wonderful site, it is worth watching the talk.

---

**Featured (these are simply two of my favourite sessions which didn’t make it into any of the categories above)**

- <a href="https://developer.apple.com/videos/play/wwdc2017/702/">702 Privacy and Your Apps</a>

🍿🍿🍿🍿

Some thoughts about privacy which will soon become a luxury. Along the way you will get acquainted with DeviceCheck.

— 

- <a href="https://developer.apple.com/videos/play/wwdc2017/803/">803 Designing Sound</a>

🍿🍿🍿🍿
Wonderful session about the significance of sound (after all we developers still don’t acknowledge this).

> If you are a self-respecting developer, when the new iOS comes out you will stop using iOS 9 and will be able to enjoy the full force of iOS. So now is the time to brush up on what’s new and has been announced at WWDC 2016, and make the most of the most basic version of the application intelligently and usefully.

*This article was originally published on <a href="https://badootech.badoo.com/advanced-wwdc-2017-guide-b6278ba0c94b">Alex's Medium account</a>.*

**Alexander Zimin, iOS developer**
