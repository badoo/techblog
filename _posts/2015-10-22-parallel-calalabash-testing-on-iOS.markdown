---
layout: post
title: Parallel Calabash Testing on iOS
author: Tim Baverstock
date: 2015-10-22
categories: ios
---

We want our users to have the same experience of Badoo on mobile regardless of which platform they run, so we have a battery of 450 Cucumber tests and growing that we run against all platforms: Android, iOS, and mobile web (we’re working to add Windows). These 450 tests take between 8 and 12 hours to run, which makes for a very slow feedback loop, which makes for grumpy developers and grumpy managers.

Although Calabash only supports a single thread of testing at a time, it’s easy enough to run with multiple Android devices using the Parallel Calabash project from GitHub: just plug in a few phones and/or simulators, and the tests complete in a fraction of the time. The more devices, the faster things go, turning those frowns upside-down.

Unfortunately, it’s long been understood that running multiple iOS tests on a single MacOS host is impossible: you can only run one simulator at a time, the ‘instruments’ utility can only control one simulator at a time, and because of this anyone automating iOS - like Calabash - has made reasonable assumptions that reinforce the situation.

### A little knowledge is sometimes a useful thing

It was obvious that we could run these tests in parallel on one host by setting up virtual machines, but that’s quite a heavyweight solution. After some simple experiments (which I conducted because I didn’t know any better) it became clear it would be possible to run the tests on the same host as two users, each with a desktop: one normal log-in, the other via TightVNC (because Apple’s Screen Sharing doesn’t allow you to log into your own machine).

A little checking around on the web revealed that with XCode 6.3, instruments quietly began to be able to run multiple devices at once from the command-line. We haven’t noticed any announcement from Apple about it, and we’ve found that it’s only XCode 7 that makes it reliable for us, but it’s a welcome change all the same.

With this insight, I set about adding iOS support to the Android-based Parallel_Calabash project on GitHub - not the most elegant solution, but eminently practical.

### The long and winding road

Initially it was an optimistic tinkering: copying the application directory for each ssh user and tweaking the plists to set the Calabash endpoint to different ports. Then followed a substantial amount of trailing around inside Calabash-iOS to understand its internals to find out why only one simulator was resetting, why they were pretending to be real phones, and various other issues. 

I worked out a trivial Calabash monkey-patch to resolve the resetting issue and puzzled though the assumptions causing the rest.

Then there was a similar amount of hair-pulling to arrange that the test user accounts each had an active desktop: I initially started looking into TightVNC to disable its pop-up dialogue, then send automated keypresses to choose a user and type its password, but switched to Apple’s Screen Sharing once I found that it could already be supplied with a username and password directly (`vnc://user:pass@host:port`), and foxed into logging back into the local machine with an ssh tunnel (`ssh -L 6900:localhost:5900 user@localhost`).

I had an unexpectedly frustrating and drawn-out struggle to get the logging-in automated: despite having been told to log in as a particular user, Apple’s Screen Sharing insists on asking

![Apple Screen Sharing... ORLY!? YARLY!!]({{page.imgdir}}/apple-screen-sharing-really.png) 

There seems to be no way to forestall that question (such as, adding `?login=1` to the VNC URL), so I ended up trying to run AppleScript from a shell script to respond, and then fighting with the UI Automation security system to authorise it - and losing. I ultimately rewrote the shell script completely in AppleScript - an experience reminiscent of coding 1970s COBOL - and then fighting with the UI Automation security system to authorise that instead - the result is misc/autostart_test_users, mentioned below.

Then I had to find out how to authorise that automatically on each testing host, and finally how to create all the test users automatically, without needing to confirm manually on the first login that - yes, these robots aren’t interested in iTunes accounts. You’ll find this last bit easily enough if you search the web for DidSeeSyncSetup, but you have to know to look for that! This is all coded into misc/setup_ios_host.

The final hurdle was that some of our tests do a little bit of screen-scraping with Sikuli to log in to Facebook. I discovered that we needed to use Java 1.7 (not 1.8) and `set ADK_TOOLKIT=CToolkit` to let a Java program invoked from an ssh context access the desktop.

So now we have a working system, and the maintainer of Parallel Calabash has incorporated the iOS solution into the main branch on GitHub. 

### Setting up

Each test machine has a main user, in our case the TeamCity agent user, and a set of test users. I’ve automated most of the set-up.

1. On a Mac/Unix machine, run: `git clone https://github.com/rajdeepv/parallel_calabash`

1. Now edit `parallel_calabash/misc/example_ios_config` if you need to - perhaps add a few more to the list of USERS (we’re using 5 for sysctl hw.logicalcpu = 8). It’s safe to run this script against a machine that’s already been set-up, if you want to change the settings.

1. Make sure you can ssh to your main test user on the test machine (the test user must be an administrator account), then run `cd parallel_calabash/misc; ./setup_ios_host mainuser targethost example_ios_config` It should report success for each new QA user.

1. Add `misc/autostart_test_users.sh` to your build script (or copy/paste it in).

1. Then change your build’s invocation of calabash to use parallel_calabash as follows:

Parallel_calabash performs a dry run to get a list of tests that need to be run, and then runs the tests for real, so you will need to separate your calabash options into report-generation options (which aren’t used during the dry run) and the other options. For instance:

{% highlight sh %}
bundle exec parallel_calabash
  --app build/Applications/Badoo.app
  --ios_config /Users/qa/.parallel_calabash.iphonesimulator
  --simulator 'com.apple.CoreSimulator.SimDeviceType.iPhone-6 com.apple.CoreSimulator.SimRuntime.iOS-8-3'
  --cucumber_opts '-p ios_badoo IOS_SDK=iphonesimulator'
  --cucumber_reports '--format pretty -o build/reports -p parallel_cucumber_reports'
  --group-by-scenarios
  --device_target 'iPhone 6 (8.3)'
  --device_endpoint 'http://localhost:37265'
  features/
{% endhighlight %}

Briefly:

- `--app` puts parallel_calabash in iOS mode, and tells it where to find the app build.
- `--ios_config` says which config to use - we select between simulator or device configs.
- `--simulator says` which simulator to clone for parallel users
- `--cucumber_opts` gives the options for use with dry_run to get a list of tests
- `--cucumber_reports` gives the options for use with the actual test-runs
- `--group-by-scenarios` says to share tests equally between the parallel users
- `--device_target` and --device_endpoint gives the default simulator to use if the configuration doesn’t specify test users (in which case, the main user will run all the tests by itself, on its own desktop, as if you were using calabash-ios directly)
- `features/` is the standard general test specification.

### Next

There are a few developments I’m planning to implement:

* Allowing parallel_calabash to control users on additional machines, for even more parallelism.
* Feeding past test timings to parallel_calabash so it can try to arrange for all users to finish at the same time - less idle time means faster test results (Ideally, all this parallelism would happen within Cucumber, and Cucumber’s threads would request a test from a central list as it completes each current test, but that’s complex).
* Using TightVNC instead of Apple’s Screen Sharing to enable video capture of each test: if a secondary user tells QuickTime to record, it actually records a garbled version of the primary desktop. I would arrange for TightVNC to encode its own video stream. Currently, we enable video capture only during a re-run of fewer than 40 failures which has been forced into non-parallel mode by using `--device_filter=something-matching-no-device`.
* While I’m messing about with VNC, I might also investigate a Sikuli-like screen scraping scripting mechanism - since I’ll need to arrange something like that to log in anyway.

