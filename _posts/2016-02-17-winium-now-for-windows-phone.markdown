---
layout: post
title:  Winium - Now for Windows Phone
author: Nick Abalov
date:   2016-02-17
categories: QA
excerpt: There are no convenient open source automated testing tools for Windows Phone and Windows. The existing tools are proprietary, have limitations and suggest their own approach that would differ from conventional standards like Selenium WebDriver. In this post we will present Selenium compatible open source tools for Windows Phone automation.
---

We're delighted to announce that we are publishing guest writer, Nick Abalov's first article on our blog. Nick has been kind enough to share his work with us.

<img class="no-box-shadow" src="{{page.imgdir}}/intro.png" title="Winium.Desktop"/>

There are no convenient open source automated testing tools for Windows Phone and Windows. The existing tools are proprietary, have limitations and suggest their own approach that would differ from conventional standards like Selenium WebDriver. In this post we will present Selenium compatible open source tools for Windows Phone automation.

A colleague of mine, [skyline-gleb](http://habrahabr.ru/users/skyline-gleb/), has recently published a post on [Badoo Tech](https://techblog.badoo.com/blog/2016/01/25/winium-desktop-selenium-for-windows-based-desktop-applications/) about our own Selenium-like tool for automated functional testing for Windows-based desktop applications. At the same time we were also developing a similar tool for Microsoft mobile platforms.

This article will tell you about the story behind this tool, advantages of a single automated testing platform for all mobile platforms, and about how to implement it within your projects.

Let me provide you with some background.

- October 2010. Windows Phone 7 was released. A year later Expensify released [WindowsPhoneTestFramework](https://github.com/Expensify/WindowsPhoneTestFramework) – an open source BDD tool to test native applications.
- October 2012. Windows Phone 8 was released. Microsoft still did not release a tool for testing via UI.
- February—March 2014. We published the first prototype of WinphoneDrvier, the first open source Selenium implementation for native Silverlight Windows Phone-based applications.
- In April 2014 Microsoft released Windows Phone 8.1. Almost 4 years later than expected, they released official tools to test Windows Phone-based applications via UI: CodedUI. Unfortunately, this tool is not compatible with Selenium, and it is only available in the most expensive Visual Studio subscriptions.
- In May 2014 Salesforce.com published [windowsphonedriver](https://github.com/forcedotcom/windowsphonedriver/) (Selenium implementation to test web applications for Windows Phone) as open source. At almost the same time we have updated our driver to support Windows 8.1.
- In February 2015 we published Winium.StoreApps as open source. It is an updated version of winphonedriver that implements a fair share of protocol commands and supports native StoreApps applications for Windows Phone 8.1. This is the driver we use in our processes.

Right afterwards we presented our tools on [Codefest 2015](http://meetupvideo.com/2015/09/09/windows-phone-automation-and-windows-desktop-automation-from-nikolai-abalov/). We had an informal talk there with [Sathish Gogineni](https://techblog.badoo.com/authors/sathish-gogineni/) from Badoo that developed into an idea of Winium CodedUI, implementation of a Selenium driver based on CodedUI that would support native and hybrid applications, and—last but not least—direct tests on devices.

When the project started there was only one open tool: [Expensify/WindowsPhoneTestFramework](https://github.com/Expensify/WindowsPhoneTestFramework). It did not suit us because it was incompatible with Selenium, had a non-standard API and was developed for BDD approach. Apart from that, it is customised to BDD. In the course of our project development Microsoft implemented their own tool called CodedUI. Again, it had its own non-standard API, was customised for coding tests in Visual Studio on C#, was closed source and not free (which is not easy to scale).

So, that was a bit of a retrospective journey. Back to Winium. Since the tools we mentioned did not suit us, we decided to make a tool of our own. That is how the [Winium](https://github.com/2gis/Winium) project was born. It started as a tool of automated testing for Windows Phone Silverlight applications and soon turned into a comprehensive set of automated testing tools for a Windows platform:

- [Windows Phone Driver](https://github.com/2gis/winphonedriver): a driver for native Windows Phone Silverlight applications
- [Winium for Store Apps](https://github.com/2gis/Winium.StoreApps): a driver for native Windows Phone Store Apps applications
- [Winium.StoreApps.CodedUi](https://github.com/2gis/Winium.StoreApps.CodedUi): a CodedUI driver for Windows Phone XAML-based applications
- [Winium for Desktop](https://github.com/2gis/Winium.Desktop): a driver for native Windows Desktop applications
- [Winium.Cruciatus](https://github.com/2gis/Winium.Cruciatus): a library to automate Windows Desktop applications

We have already discussed Winium.Desktop and Winium.Cruciatus on Habrahabr and Badoo tech blog posts. Today we will discuss Winium for Store Apps (descendant of Windows Phone Driver) and about Winium.StoreApps.CodedUi.

<br/>

# Winium.StoreApps

## Main features and the limitations of the driver.

Winium.StoreApps: the main driver implementation for mobile applications. We actively use and develop it in our day to day processes. The source code is open and available [on GitHub](https://github.com/2gis/Winium.StoreApps).

Main features:

- It implements Selenium protocol to test native StoreApps applications for Windows Phone platform
- It works with Json Wire Protocol; one can use Selenium- or Appium bindings and code tests in the same manner as for iOS or Android
- It supports installation and launch of the app being tested as well as uploading files to a local storage on the app
- It supports single-touch gestures
- It provides a basic inspector to view an UI tree of the tested application
- It supports Selenium Grid, which lets us parallelise the tests run.

Limitations:

- Only emulators are supported (with some changes, though the driver can install the app on the device and work with it, but we still don’t know how one can provide a fully functional simulation of gestures and input on the devices)
- One must embed an automation server into the app under test (i.e., add a nuget package to the app and add one code line that would run the server on a separate thread. It definitely breaks the first Appium rule, but it is the only option, besides CodedUI, that we were able to find)
- Only one session is supported, but one can connect the driver to Grid to distribute the tests and to run them in parallel.

Winium.StoreApps supports all main commands of Selenium, and it can be integrated into an existing infrastructure for testing (Selenium- or Appium-based). Generally, one can actively use it in a continuous process (that’s what we are doing).

<br/>

## How it all works.

Technically, Winium.StoreApps.Driver.exe is an HTTP server that implements JsonWire/WebDriver REST protocol. When necessary, Driver proxies the incoming commands to InnerServer (a test automation server) that is integrated into the application to be tested.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png" title="Interaction structure among tests, the driver and the tested app."/>
*Interaction structure among tests, the driver and the tested app.*

## How to prepare an application and how to code tests.

One should follow three simple steps to launch tests against our application:

- Prepare the application
- Code tests (ok, this one is not that easy)
- Run tests

### Preparing an application

This is an easy one: we add a [Winium.StoreApps.InnerServer](https://www.nuget.org/packages/Winium.StoreApps.InnerServer/) nuget package and initialise automation server on the main thread after the UI is created. In MainPageOnLoaded method, for example. The server is initialised on the main thread only to get a correct dispatcher. The server will operate on another thread, apart from direct access to UI.

Then it would be really nice to enable testability of the app by specifying names and identifiers for the elements you are planning to use in test (this is not mandatory, however).

That’s it. The only thing you need to do now is to create an appx package with your application.

<br/>

### Coding tests

The tests are coded in the same way that web or mobile devices are with Selenium or Appium bindings.

The first thing you need to do is to create a new session. During its creation one can specify various properties. Here’s a list of basic ones that are supported by the driver (The complete list can be found on [wiki](https://github.com/2gis/Winium.StoreApps/wiki/Capabilities)).

{% highlight python %}
dc = {
    'deviceName': 'Emulator 8.1 WVGA 4 inch 512MB',
    'app': r'C:\YorAppUnderTest.appx',
    'files': {
        {
            'C:\AppFiles\file1.png': 'download\file1.png',
            'C:\AppFiles\file2.png': 'download\file2.png'
        }
    },
    'debugConnectToRunningApp': False
}
{% endhighlight %}

- deviceName is a partial name of a device where we will run our tests. If left empty, the first emulator from the list will be chosen.
- app: a complete path to the appx package with the tested app featuring a built-in automation server.
- files: a dictionary of files that would be uploaded from a local disk to local storage of the application.
- debugConnectToRunningApp: allows you skip all steps of installation and file upload into the app and to connect to the running application. It may be convenient if you ran an application from a Visual Studio, set all the breakpoints and now you want to debug an error that occurs in the app during one of the tests.

Ok, we’ve created a session and run the app. Now we need to detect the elements if we need to interact with them. The driver supports the following locators:

- id: AutomationProperties.AutomationId
- name: AutomationProperties.Name
- class name: full class name (Windows.UI.Xaml.Controls.TextBlock)
- tag name: same as class name
- xname: x:Name, a legacy locator. Normally it is not supported by default bindings and requires you to rework bindings for usage. At the same time, it enables search by name that is normally assigned to an element for access from code.

In order to enable the search of locators and comprehension of UI structure of the tested app in general, we have created an inspector that can connect to the application and display the current UI state as seen by the driver.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png" title="Inspector’s main window"/>
*Inspector’s main window*

There is not much the inspector can do now, but it does provide some basics like screenshot, UI tree as seen by a driver with all known elements, locators and their basic properties, like position, visibility and text this should help to get started with writing tests.

Ok, we have found the element. Now we can fiddle with it in any way we please.

{% highlight python %}
# you can request text value of element
element.text

# you can click (tap) element
element.click()

# you can simulate user input into element
element.send_keys('Hello!'+Keys.ENTER)

# you can get any public property value of element
element.get_attribute('Width')

# можно запросить вложенное свойство
element.get_attribute('DesiredSize.Width')

# you can even get a complex property value as JSON
element.get_attribute('DesiredSize')
# '{"Width":300.0,"Height":114.0,"IsEmpty":false}'
{% endhighlight %}

One click is not enough for a world of mobile phones. We need gestures. We are supporting the good old API from JSWP, and need to add support for a new Mobile WebDriver API soon. Feel free to make flicks and scrolls already.

{% highlight python %}
TouchActions(driver).flick_element(element, 0, 500, 100).perform()
TouchActions(driver).scroll(200,200).perform()

# you can even create custom gestures
ActionChains(driver) \
.click_and_hold() \
.move_by_offset(100, 100) \
.release().perform()

{% endhighlight %}

Since we are integrating the automation server into the app, you will be able to do way more interesting tricks. Like calling MS Accessibility API commands:

{% highlight python %}
# direct use of Windows Phone automation APIs
app_bar_button = driver.find_element_by_id('GoAppBarButton')
driver.execute_script('automation: invoke', app_bar_button)

list_box = driver.find_element_by_id('MyListBox')
si = {'v': 'smallIncrement', 'count': 10}
driver.execute_script('automation: scroll', list_box, si)
{% endhighlight %}

It will let you use precise means of scrolling elements instead of gesture simulation.
Besides, one can assign a value to a public property, though we do not recommend you do that in tests:

{% highlight python %}
text_box = driver.find_element_by_id('MyTextBox')
driver.execute_script('attribute: set', text_box, 'Width', 10)
driver.execute_script('attribute: set', text_box, 'Background.Opacity', 0.3)
{% endhighlight %}


However, there are situations when this is justified. In our tests, for instance, we use this API instead of moving a map by gestures to move it precisely into the required position.
This list of commands that are supported by the driver is far from being complete. The more detailed list and notes on commands [can be found in wiki](https://github.com/2gis/Winium.StoreApps/wiki/Supported-Commands).
Let us create a simple test based on all these commands:
A code for a simple test

{% highlight python %}
# coding: utf-8
import os

from selenium.webdriver import Remote
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

class TestAutoSuggestBox(object):
    def setup_method(self, _):
        executor = "http://localhost:{}".format(os.environ.get('WINIUM_PORT', 9999))
        self.driver = Remote(command_executor=executor,
                             desired_capabilities={'app': 'aut.appx'})

    def test_select_suggest(self, waiter):
        self.driver.execute_script("mobile: OnScreenKeyboard.Disable")

        pivots = self.driver.find_elements_by_class_name("Windows.UI.Xaml.Controls.Primitives.PivotHeaderItem")
        pivots[1].click()

        autosuggestion_box = waiter.until(EC.presence_of_element_located((By.ID, 'MySuggestBox')))
        autosuggestion_input = autosuggestion_box.find_element_by_class_name('Windows.UI.Xaml.Controls.TextBox')
        autosuggestion_input.send_keys('A')

        suggestions_list = waiter.until(EC.presence_of_element_located((By.XNAME, 'SuggestionsList')))
        suggestions = suggestions_list.find_elements_by_class_name('Windows.UI.Xaml.Controls.TextBlock')

        expected_text = 'A2'

        for suggest in suggestions:
            if suggest.text == expected_text:
                suggest.click()
                break

        assert expected_text == autosuggestion_input.text

    def teardown_method(self, _):
        self.driver.quit()
{% endhighlight %}

We create a new session for this example. We hide the screen keyboard (both for a demonstration and to get it out of the way).

We switch to the second tab in the pivot element. We find an input field and start typing. Then we select one of the suggestions in the list and check if the value in the input field is the same as the prompt value. Then we close the session.

### Starting the tests

Now you need to do the easiest part. Run Winium.StoreApps.Driver.exe (you can download this one from [GitHub](https://github.com/2gis/Winium.StoreApps/releases)), run the tests by our favourite test runner and enjoy the magic.

[Demo](https://www.youtube.com/watch?v=R0xG4GlSal0).

### Winium CodedUI

Main features and limitations of the driver.
The idea of creating a prototype for a Selenium driver that would wrap CodedUI came into our heads after Codefest 2015. We brought it to life, and the result is currently available [on GitHub](https://github.com/2gis/Winium.StoreApps.CodedUi).

Main features:

- It does not require to modify the tested app; you can even test pre-installed apps or apps that you downloaded from a store
- It works both on emulators and on devices
- It is compatible with Json Wire Protocol
- It supports native applications
- It has a limited support of hybrid apps already.

Limitations:

- It is an early prototype, so some stability problems can be possible
- A license for Visual Studio Premium or higher is required (for 2013, for 2015—Business)
- One session only.


## How it all works

It all operates based on the same principles as in StoreApps, but now instead of integrating a server into the app we launch the server as a separate background process via vs.test.console and CodedUI. This test server has got access to device and UI of the running applications directly via Accessibility API (in order to search for elements, for example) and via CodedUI API (for gestures, etc.).

<img class="no-box-shadow" src="{{page.imgdir}}/3.png" title="Interaction structure among tests, the driver and the tested app."/>
*Interaction structure among tests, the driver and the tested app.*

## How to prepare an application and how to code tests

Since this approach does not require amendments to the tested application, one can test both released app versions and pre-installed apps. That means that this version of the driver is as close as it can be to [Appium philosophy](http://appium.io/introduction.html). This is an advantage and a disadvantage at once, because it applies access restrictions to some internal parts of the app.

No particular app preparation is required. The tests are coded and run in the same manner as they are done for Winium.StoreApps.

This is [a demo video](https://www.youtube.com/watch?v=DE8UbzcHmak) where we automate creation of an event in a standard and pre-installed Calendar app.
Example code

{% highlight python %}
from time import sleep
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.wait import WebDriverWait

def find_element(driver, by, value):
    """
    :rtype: selenium.webdriver.remote.webelement.WebElement
    """
    return WebDriverWait(driver, 5).until(expected_conditions.presence_of_element_located((by, value)))

winium_driver = webdriver.Remote(
    command_executor='http://localhost:9999',
    desired_capabilities={
        'deviceName': 'Emulator',
        'locale': 'en-US',
    })

# AutomationId for tiles can not be used to find tile directly,
# but can be used to launch apps by switching to window
# Actula tile_id is very very very long
# {36F9FA1C-FDAD-4CF0-99EC-C03771ED741A}:x36f9fa1cyfdady4cf0y99ecyc03771ed741ax:Microsoft.MSCalendar_8wekyb3d8bbwe!x36f9fa1cyfdady4cf0y99ecyc03771ed741ax
# but all we care about is part after last colon
winium_driver.switch_to.window('_:_:Microsoft.MSCalendar_8wekyb3d8bbwe!x36f9fa1cyfdady4cf0y99ecyc03771ed741ax')

# accept permisson alert if any
try:
    accept_btn = winium_driver.find_element_by_name("allow")
    accept_btn.click()
except NoSuchElementException:
    pass

# now we are in calendar app
new_btn = find_element(winium_driver, By.NAME, "new")
new_btn.click()
sleep(1)  # it all happens fast, lets add sleeps

subject = find_element(winium_driver, By.ID, "EditCardSubjectFieldSimplified")
subject.send_keys(u'Winium Coded UI Demo')
sleep(1)

# we should have searched for LocationFiled using name or something, but Calendar app uses slightly different
# classes for location filed in 8.1 and 8.1 Update, searching by class works on both
location = winium_driver.find_elements_by_class_name('TextBox')[1]
location.send_keys(u'Your computer')
sleep(1)

save_btn = find_element(winium_driver, By.NAME, "save")

save_btn.click()
sleep(2)

winium_driver.close()
winium_driver.quit()
{% endhighlight %}

## How does Winium help us?

Is there an advantage of creating this tool instead of using platform-specific ones?

All our mobile app teams are using unified tools now. It lets us share experiences, build a single toolkit and infrastructure to launch our tests and not to disperse our attention to different platforms. Notably, one skilled engineer has successfully switched from iOS automation to Windows Phone, shared her experience and instructed our test engineers, which has significantly raised the project level.

In the context of infrastructure, it allowed us to focus on creating one tool (vmmaster) which would provide a reproducible test environment on demand. Well, it is a good subject for a new article.

The main thing is it gave us a possibility to start uniting our tests for various platforms in a single project ([demo](https://www.youtube.com/watch?v=BwFDgcE8F7A&feature=youtu.be)).

To sum it up, we now have:

- Fewer wheels to reinvent
- Less code duplication
- Easier support
- Better code quality
- Sharing knowledge
- Systematic approach
- Faster development.

All of this is open source, of course, so feel free to use these tools to automate tests for Windows Phone apps. By the way, Winium.StoreApps is absolutely free. In order to use it you need to download the recent [release](https://github.com/2gis/Winium.StoreApps/releases) and install emulators or a Visual Studio Community with a mobile SDK. Still, to use Winium.CodedUi you will need a paid version of Visual Studio Premium or higher.
And again: [a link to repository](https://github.com/2gis/Winium.StoreApps) and [other open source 2GIS products](http://techno.2gis.ru/opensource).

Nick Abalov, 2GIS.
