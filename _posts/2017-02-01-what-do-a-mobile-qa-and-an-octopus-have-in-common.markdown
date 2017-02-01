---
layout: post
title:  What do a mobile QA and an octopus have in common?
author: Kateryna Mikheeva
date:   2017-02-01
categories: QA
excerpt: It’s early morning, you are the mobile QA. You get ready for your day, and make yourself a strong coffee. You are about to test a couple of new features for your app, and you need to pick up some devices to check the new functionality. What devices should you pick?
---
Hi! My name is Katya and I am a tester for one of the most popular dating apps: Badoo.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

Picture this: it’s early morning, you are the mobile QA. You get ready for your day, and make yourself a strong coffee. You are about to test a couple of new features for your app, and you need to pick up some devices to check the new functionality. What devices should you pick?

Sooner or later every mobile QA wonders how many devices she should use to test a new feature so that the maximum number of device-specific bugs can be caught in the minimum amount of time. The autotests are not written yet, and you face some completely new features. In the case of iOS, you at least have some kind of clarity and the list of devices is limited, but Android has spawned a devilish legion of devices. You may be surprised, but as it turns out, only 3 to 4 Android devices are required.

**What I want to tell you, from the point of view of an experienced tester, is how to choose which ones to test.**

## Why different devices need to be tested and how dangerous fragmentation is.

If your app is still working its way up to the top of the app stores, then it could be enough just to test it on one typical device. However, if thousands of people use your app every day, then you would have to think about **diversifying devices** and investigating **the idiosyncrasies** and **problems connected** with the diverse range of Android devices available.

Even if your app works perfectly using an emulator, or on your ‘Really Blue Pixel’, the statistics for popular Android devices tells us that no device has a share of more than 10% of the market. Unlike, say, in the case of iOS. So, this kind of one-off testing cannot guarantee that most users won’t experience problems. Different devices have different manufacturer ‘improvements’, different OS versions, and different hardware specifications — all of these factors can  be the cause of device-specific bugs.

The more popular your app, the more devices you will need to subject to  a comprehensive check. And the more functionality your app has, the more likely it is that you will encounter problems.
The only solution is to accumulate devices.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>
*Have you ever tried smartphone Jenga?*

Our company has a large collection of mobile devices (at present we have about 60 different Android smartphones and tablets) and there are automated test stands on which autotests are running on real devices.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>
*The autotests are at work while the tester is asleep*

## What bugs are we looking for?

Bugs which you can encounter on some devices but not on others can be divided into three categories:

1. Related to the device manufacturer, for example non-standard APIs, cameras, or a customised system library;
2. Related to the Android OS version, for example non-compatible API and performance issues (top-of-the-range just five years ago, when no one dreamed of 512 Mb memory);
3. Related to the screen size/resolution, chipset, or other hardware differences.

More often than not, these problems are unrelated, so you don’t have to use <a href="http://www.pairwise.org/" target="_blank">pairwise testing</a>.

## Manufacturer bugs

Modern mobile device manufacturers love re-inventing the wheel. I am referring to all sorts of firmware upgrades and interface modifications. The best-case scenario is that you will just come across bugs related to the user interface which the manufacturer has altered for particular devices. For example, this kind of bug can crop up due to custom fonts or increased default font size.

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>
*Fantastic Ek and where to find what job she does*

This means that the UI (user interface) starts to get distorted (as on the screen) and  developers will have to either to take that into account or to use their own font and disallow other fonts. This problem used to crop up only on cheap Chinese devices, but now it has made its way up to top-of-the-range Korean devices (I would rather not give specific examples and give the manufacturers negative publicity). The statistics for your app will tell you whether or not you need to take these devices into account.

In the worst-case scenario (for developers) more significant, deep-seated problems will cause a crash due to the use of custom manufacturer-modified libraries and methods. Besides this, bugs may be connected to custom applications your software interacts with. Such as, a camera or a built-in file manager.

The developers will face a choice: either write their own implementation of a standard component, like a camera or file manager, or send the users from your pristine app off to the morass of manufacturer sub-systems, from whence they won’t come back the same. Problems with file managers are mostly encountered with Chinese devices, and so maybe it is not worth worrying about them. But problems with cameras crop up more often.

Any camera-related peculiarities the manufacturer has added may affect your app and lead to crashes, problems with auto-focus, pictures showing the wrong way round and so on. As in the previous case, you will have to make a decision based on the percentage of affected users, and you have one of two options: either do your own custom camera programming or correct the photos as problems crop up.
To check for these problems, you need a device with altered, non-conventional firmware, and lots of in-house applications and manufacturer preloads. The ideal devices are Samsung and Sony.

## Android bugs

Developers like to use whatever is new and interesting, but they don’t like to do Google searches for compatibility tables for various API and OS versions. Developers may not lose any sleep, but testers do; incompatibility between versions means a large number of potential bugs.

For this kind of testing we need to avail ourselves of devices with the most popular OS versions. As a rule, there aren’t that many of them. One of my favourite sites, <a href="https://developer.android.com/about/dashboards/index.html" target="_blank">Android Developers</a>, can help you make your choice.

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>
*Not all Androids like oval*

You should take into consideration your own statistics in respect of devices, as the specifics of your app may favour a particular user base.

Obviously, it is very important to look for bugs in the most recent OS version; in about a year’s time that version might become the most popular. And above all your app shouldn’t crash on reference devices from Google. However, there aren’t that many devices with the very latest Nougat Android version, because updates aren’t rolled out that often. So, you can either rely on autotests to discover these bugs, or manually run regression tests on those devices from time to time. The main thing is to check for potential hazards with major OS updates, such as an aggressive <a href="http://www.androidcentral.com/inside-marshmallow-what-doze-how-do-i-use-it-and-what-does-it-do" targt="_blank">Doze Mode</a> and its <a href="https://developer.android.com/topic/performance/background-optimization.html#connectivity-action" target="_blank">effects</a>, especially if your app tracks connection to the internet. Not just developers, but testers as well need to keep track of major changes to the new versions of Android.
Another set of issues will crop up on weak devices. The Android operating system does not impose any restrictions on which hardware can be used – something which lots of manufacturers have taken advantage of for the sake of making savings on everything. Practically any app will crash if a weak mobile device does not have enough memory. It is not possible to protect oneself against this entirely, but it should be taken into account, especially if you are using any kind of ‘energy-guzzler’ functions such as video calls or video recording.

To test for these cases, you need to have a weak device. You need to check whether the app functions on it adequately. It will be interesting to see how your app performs when there is insufficient RAM or internal memory.

## Dodgy resolutions and modes

<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>
*Similar or different?*

These problems are not strictly speaking device-related. More often than not, they are simply software issues related to your app's interface. However, the popularity of one or other screen resolution and size is closely related to the popularity of the relevant devices, and it is constantly changing. Manufacturers can also add some complexity, such as the option to select Pixel Density on OnePlus 3 (and in Nougat it became an option right in the settings).

Regardless of the <a href="https://developer.android.com/about/dashboards/index.html" target="_blank">statistics</a> for popular screen resolutions and sizes, you also need to include a tablet: this allows you to catch problems such as interface elements which have been lost in the form (on a small screen these will be off-screen, but on a large screen they will become visible), or forgotten alignment for text and pictures which on a small screen might appear to be in the right place. These errors may not be that crucial, but they can have a negative effect on your app’s reputation.

## Conclusions: choosing devices

<img class="no-box-shadow" src="{{page.imgdir}}/7.png"/>

For positive tests, vanilla Google devices are also fine. They provide us with clean tests and it means that when any errors are discovered on other devices it will immediately be obvious that they are in some way related to the device in question.

Finally, this is how we make our choice:

- Find out which devices are the most popular for your app at the present moment
- Check <a href="https://developer.android.com/about/dashboards/index.html" target="_blank">up-to-date information</a> for Android versions and screen resolutions (or use your own statistics from your Google Play Developer Console).
- Choose the most popular device for carrying out positive tests.
- From the remaining popular devices choose a weak device with the lowest screen resolution.
- Check whether the devices you have chosen cover all popular versions of Android, all screen resolutions and sizes.

Plus, choose the most popular tablet (as an additional device).
As a rule, three devices cover most of the possible permutations.

## This is our choice!

Badoo now has more than 333 million registered users across the world and the number of installs on an Android platform has passed the 100 million mark. Let’s run through the list of steps using current data for Badoo while our coffee is cooling a bit.

The most popular devices (based on our own statistics; I am not going to give exact percentages as these figures are liable to change in a very short space of time; note that the overall popularity for each device is no more than 5% though):

- Samsung Galaxy S4;
- Samsung Galaxy S5;
- Samsung Galaxy S6;
- Samsung Galaxy S7.

The most popular Android versions (this data from Google is very close to our own statistics):

- Android 6.0 – 26.3%;
- Android 4.4 – 24%;
- Android 5.1 – 23.2%;
- Android 5.0 – 10.8%.

<img class="no-box-shadow" src="{{page.imgdir}}/8.png"/>

The most widespread screen resolutions and sizes on devices (this data from Google is also very close to our own statistics):

- Normal with HDPI – 38.0%;
- Normal with XHDPI – 31.4%;
- Normal with XXHDPI –15.8%;
- MDPI resolution is also popular (9.4%), but on devices with various screen sizes.

<img class="no-box-shadow" src="{{page.imgdir}}/9.png"/>

<a href="https://developer.android.com/guide/practices/screens_support.html" target="_blank">Breakdown of this table</a>.

Popular manufacturers of mobile devices (statistics on which manufacturers are popular depend on the countries where your app is popular at the present time. In our case, it is as follows):

- Samsung;
- Motorola;
- Huawei;
- LG.

If you take a look at this data, then at the present time the ideal device for positive tests would be **Samsung Galaxy S6** with Android 6.0 and XXHDPI large/normal screen.

Since **Samsung Galaxy S3 Neo** with Android 4.4 and XHDPI normal screen is the most popular device with the smallest screen (compared with SGS4 and SGS6) and also quite weak (it’s quite an old device released in 2014), it is perfectly suits for negative testing.

Plus, we include **Samsung Galaxy S4** with Android 5.0 and XHDPI normal screen; it ideally complements the set of devices to be tested, as it has the popular Android version 5.0 and an average screen size.

**Given these three devices we get the following coverage of Android fragmentation:**

- Android versions: 26.3+24+10.8=61.1%, but you could add additional 23.2 to get a figure of 84.3% (since bugs that crop up on version 5.0, but not on 5.1 are very rare);
- screen sizes: 6.7+ 88.3=95%;
- screen resolutions: 32.4+15.8=48.2% - but this is not enough. We add different models of SGS3 for testing. SGS3 mini with HDPI screen covers one more popular resolution and 38.8% more, which is why we have a total result as 87%.

In other words, 3 to 4 devices give us coverage of more than 80% of the variations of Android devices which are of interest to us. If we cannot cover about 80% based on any given parameter, that means we need to add another device. But, as a rule, three is entirely sufficient.

**Good additions might be:**

- a tablet;
- a device with pure unmodified Android;
- a device that increases coverage in terms of popular manufacturers of devices.

I usually add **Asus Nexus 7** (2013) as a tablet with pure Android. Another suitable one would be Huawei MediaPad M2.

<img class="no-box-shadow" src="{{page.imgdir}}/10.png"/>

So, four devices make the ideal set for an Android tester and therefore the ideal tester should have 4 arms. Or she could be an octopus with two tentacles per device!
In the end we would pick **Asus Nexus 7, Samsung Galaxy S3, S4** and **S6** and head off for coffee!
It turns out that choosing devices isn’t that scary after all. And the coffee hasn’t even gone cold yet.

### Related links

- <a href="https://developer.android.com/about/dashboards/index.html" target="_blank">Statistics from Google</a>
- <a href="https://developer.android.com/guide/practices/screens_support.html" target="_blank">Breakdown of screen sizes and resolutions for Android devices</a>
- <a href="http://www.gsmarena.com/" target="_blank">Gsm Arena is the best site for finding information about practically any Android device</a>
- <a href="http://www.androidcentral.com/inside-marshmallow-what-doze-how-do-i-use-it-and-what-does-it-do" target="_blank">About Doze Mode</a>
- <a href="https://opensignal.com/reports/2015/08/android-fragmentation/" target="_blank">Diagrams about fragmentation</a>
- <a href="http://www.antutu.com/en/view.shtml?id=8218" target="_blank">AnTuTu statistics</a>
- <a href="https://www.browserstack.com/test-on-the-right-mobile-devices" target="_blank">BrowserStack with information about some regional specifics</a>


P.S. <a href="https://ru.pinterest.com/moonlight_child/hacker-girl-facebook-stickers/" target="_blank">The stickers are taken from the post</a>.

**Ekaterina Mikheeva, Android QA**
