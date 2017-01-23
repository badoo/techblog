---
layout: post
title:  Breaking the limitation of Calabash-Android!
author: Rajdeep Varma
date:   2017-01-24
categories: Testing Android
excerpt: We have been using Calabash for automated testing at Badoo since before Appium existed. The stability of Calabash is great and it’s still faster compared to Appium, so we don’t want to migrate. But, to automate a feature-rich application like Badoo, we had to overcome the ‘only application UI’ limitation of Calabash.
---
Two of the most popular drivers for **Android** app automation are **Appium** and **Calabash**. While both have their pros and cons, their major limitations are:

- Calabash: Can only drive UI which is part of the application under test; in particular there is no support for testing notifications.
- Appium: Cannot call backdoor methods in the application like Calabash (<a href="https://developer.xamarin.com/guides/testcloud/calabash/working-with/backdoors/#backdoor_in_Android" target="_blank">https://developer.xamarin.com/guides/testcloud/calabash/working-with/backdoors/#backdoor_in_Android</a>). Backdoors are very helpful to set the state of application under test.

We have been using Calabash for automated testing at Badoo since before Appium existed. The stability of Calabash is great and it’s still faster compared to Appium, so we don’t want to migrate. But, to automate a feature-rich application like Badoo, we had to overcome the ‘only application UI’ limitation of Calabash.

In the past, we had a solution which is blogged <a href="https://techblog.badoo.com/blog/2015/06/01/testing-android-notifications-with-calabash/" target="_blank">here</a>. While this solution works, there was some degree of flakiness due to device dynamics (screen size, Android OS variant etc.).

In this article, I will describe how I solved the problem mentioned above by adding UiAutomator2 support to Calabash. If you can’t wait, there is a link to a ready-to-use Ruby Gem at the end.

# Understanding the Problem

Let’s have a look at the high-level architecture of Calabash-Android:

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

The Calabash-Android-server uses **Robotium**, which itself uses the Android **Instrumentation** framework to drive the application. It’s the instrumentation which gives Robotium (and hence Calabash) access to the execution environment, allowing Robotium to drive the application UI, and to implement the ‘backdoor’ invocation of application Java methods.
It is, however, also this instrumentation that means Robotium can only drive the User Interface which is part of the application code. Appium does not have this limitation because it uses **UIAutomator** (<a href=" https://google.github.io/android-testing-support-library/docs/uiautomator/" target="_blank">https://google.github.io/android-testing-support-library/docs/uiautomator/</a>).

# The Solution

Google’s Instrumentation framework is part of <a href="https://developer.android.com/topic/libraries/testing-support-library/index.html#ajur-instrumentation" target="_blank">Android’s testing support library</a>. The instrumentation framework runs in the application’s context, exposing all the interactions the system has with the application and is therefore able to drive it. Popular testing frameworks based on Instrumentation are Robotium and Espresso.
Calabash-Android uses Robotium on its server-side, and therefore it has access to your application’s Instrumentation information.

With the release of UIAutomator 2.0, Google made it part of the **Instrumentation**. This opens up the possibility of using it inside the Calabash-Android server.

The Ruby client of Calabash uses *CalabashInstrumentationTestRunner* to start instrumentation using ADB. In the Calabash-server, *CalabashInstrumentationTestRunner* extends Android’s *Instrumentation* class. This is the instrumentation object which is passed to Robotium’s Solo.

With UIAutomator 2.0, the same instrumentation object can be used to create a new UiDevice object which can drive the whole device.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

Here is how I approached the solution:

**1) Added UiAutomator library to calabash-android-server**

I cloned calabash-android-server project from <a href="https://github.com/calabash/calabash-android-server" target="_blank">https://github.com/calabash/calabash-android-server</a>) and added uiautomator2 jar in lib folder.

**2) Instantiated UiDevice object**

In <u>InstrumentationBackend.java</u> file, I created a method to instantiate UiAutomator's UiDevice object.

{% highlight java %}

public static UiDevice getUiDevice() {
    if (instrumentation.getUiAutomation() == null) {
        throw new NullPointerException("uiAutomation==null: did you forget to set '-w' flag for 'am instrument'?");
    }
    if(uiDevice == null) {
        uiDevice = UiDevice.getInstance(instrumentation);
    }
    return uiDevice;
}

{% endhighlight %}

**3) Added a new command using UIAutomatior2 apis**

Adding a new command to the Calabash-android-server is pretty easy. All commands that you can use in your Ruby code are mapped to the Actions Interface: sh.calaba.instrumentationbackend.actions

Let’s Implement an action to pull notification bar:

{% highlight java %}

public class PullNotification implements Action {
    @Override
    public Result execute(String... args) {
        InstrumentationBackend.getUiDevice().openNotification();
        return new Result(true);
    }

    @Override
    public String key() {
        return "pull_notification";
    }
}

{% endhighlight %}

In the above example, the method key() is used to name the command to be used by the Calabash Ruby client. When this command is invoked by the Ruby client, its execute() method will be triggered.

**4) Start instrumentation with -w flag**

Clone ruby client from <a href="https://github.com/calabash/calabash-android" target="_blank">https://github.com/calabash/calabash-android</a>. Patch lib/calabash-android/operations.rb to add the '-w’ flag while starting instrumentation using the ADB command.
Please refer to <a href="https://github.com/rajdeepv/calabash-android/commit/b06d67324f63280cb260eb80ec08b9daf2b6565b" target="_blank">this</a> commit on how to do it.

To see an example of the above steps you can have a look at my fork:

- Server: <a href="https://github.com/rajdeepv/calabash-android-server/tree/uiautomator" target="_blank">https://github.com/rajdeepv/calabash-android-server/tree/uiautomator</a>
- Client: <a href="https://github.com/rajdeepv/calabash-android/tree/uiautomator" target="_blank">https://github.com/rajdeepv/calabash-android/tree/uiautomator</a>

**A working example:**

Let’s look at how to pull the notification bar and touch a notification.

- Clone both the repo from my fork mentioned above at the same directory level.
<br>
git clone - <a href="https://github.com/rajdeepv/calabash-android"  target="_blank">https://github.com/rajdeepv/calabash-android</a>
<br>
git clone - <a href="https://github.com/rajdeepv/calabash-android-server" target="_blank">https://github.com/rajdeepv/calabash-android-server</a>
- Switch to the ‘uiautomator’ branch in both repos.
- Navigate to the ruby-gem folder in the calabash-android repo and build the Ruby Gem using:
<br>
bundle exec rake build
- Include this Gem in your project.
- Change “start_test_server_in_background" to "start_test_server_in_background(**<font color="purple">with_uiautomator:</font> <font color="blue">true</font>)**"
- To pull the notification bar, use:
perform_action(**<font color="green">'pull_notification'</font>**)
- To touch a notification using partial text, use:
perform_action(**<font color="green">'uiautomator_touch_partial_text'</font>**, *<font color="orange">‘my partial text'</font>*)

**A Ready to use Ruby-Gem:**

If you do not want to do the above stuff yourself, you can download the gem <a href="https://drive.google.com/file/d/0B4iebe79pe5ueWowa1NqNU5EYzQ/view?usp=sharing" target="_blank">here</a> and just follow the last three points.

# Conclusion

It took me some effort to dig into the Calabash-Android-Server code to find out how it works and to explore the possibility of this being achievable. Things did not work out on the first attempt but in the process, I got to know some of Android Instrumentation’s secrets. I will share them some other day.

While the example I shared is about the automation of push notifications using Calabash, this approach can be applied to any problem you face in automation frameworks based on Calabash, such as:

- Testing your app’s homescreen widgets
- Handling intents with “complete action using” dialogbox in an Android application
- Testing 3rd party app interactions that are started from your app

I hope this will help you to test those cases of your Android app which go out the app's UI using Calabash. If you have any questions or feedback, please feel free to leave a comment below.

**Rajdeep Varma - Automation QA Engineer**
