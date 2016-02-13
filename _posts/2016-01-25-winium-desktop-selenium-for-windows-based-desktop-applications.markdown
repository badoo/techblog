---
layout: post
title:  Winium.Desktop - Selenium for Windows-based Desktop Applications
author: Gleb Golovin
date:   2016-01-25
categories: QA
excerpt: Hi there. My name is Gleb, and I do test automation in 2GIS. Over a year ago I published an article about one of our tools Cruciatus. We use it to test user interface for Windows-based desktop applications.
---

<img class="no-box-shadow" src="{{page.imgdir}}/intro.jpg" title="Winium.Desktop"/>

Hi there. My name is Gleb, and I do test automation in 2GIS. Over a year ago I published an article about one of our tools ([Cruciatus](http://habrahabr.ru/company/2gis/blog/220337/)). We use it to test user interface for Windows-based desktop applications.

Cruciatus perfectly solves the problem of access to controls, but the tests, however, has to be written in C#. This interferes with sharing knowledge and experience among testers for various platforms: mobile, web and desktop.

We have found our solution in Selenium, which is probably the best known tool for automated testing. In this article I will tell you about our experience in crossbreeding Cruciatus and Selenium, and about testing Windows-based desktop applications using well-known Selenium bindings.

## Why was Cruciatus not enough
Almost all teams that were dealing with internal 2GIS products used Cruciatus. Each of the teams suggested improvements for the tool. So, in order to please everyone, we have reworked the Cruciatus logic completely, together with ruining its reverse compatibility. It was painful, but useful.

Besides, we have abandoned Mouse and Keyboard classes from CodedUI in order to eliminate dependence on libraries that are delivered together with Visual Studio. It means that we have learned to assemble a project on public CI servers like [AppVeyor](http://www.appveyor.com/).

As a result, we have created a convenient and a self-contained tool that solves all our problems with access to Windows-based desktop applications. However, Cruciatus still has one crucial limitation, namely C# dictatorship.

## Coming to Selenium
Selenium is a set of tools and libraries to automate testing apps in browsers. The core of a Selenium project is [Json Wire Protocol](https://code.google.com/p/selenium/wiki/JsonWireProtocol)(JSWP), a single REST protocol of interaction among tests and the app being tested.

Benefits of the single protocol:

- Tests can run on all platforms and in all browsers.
- Engineers can code them in any language. There are Selenium bindings for Python, C#, Java, JavaScript, Ruby, PHP, Perl. One can develop bindings in other languages on their own.
- Same commands work for different types of applications. For a test, a click in a mobile interface is the same as a click in a web interface.

We decided to use these advantages to automate testing desktop applications in the same manner as we use them for web.

## What is Winium.Desktop?
In order to avoid C# dictatorship, we have made a Selenium-compatible wrapper for Cruciatus. At the same time our company was busy creating Selenium-compatible tools for automatic tests, which would run with mobile Windows applications. We have united our insights under the name of Winium and called our tool Winium.Desktop.

Technically, Winium.Desktop is an http client. It implements JSWP protocol and uses Cruciatus to work with UI elements. Essentially, this is an implementation of WebDriver for Windows-based desktop applications.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png" title="Winium.Desktop"/>

We use regular Selenium bindings with Winium.Desktop in order to test Windows-based desktop applications.

## Working with Winium.Desktop
In order to start working with Winium.Desktop you should download [the latest driver release from github](https://github.com/2gis/Winium.Desktop/releases/tag/v1.5.0) and run it as administrator. This is not a mandatory provision, but otherwise you might run into an ‘Access denied’ message either from OS or from the application itself.

It’s all ready to go. Pick your favourite language and favourite IDE now and code tests in the same manner as you would do it for a web application. If you are not experienced with Selenium yet, read any manual on it. We would recommend you to start with [Selenium Python Bindings](https://selenium-python.readthedocs.org/).

The only difference from testing web applications is the following: in order to get to know elements’ locators one should use tools like UISpy or UI Automation Verify. We’ll discuss them in details below.

When you start the tests, don’t move your mouse and your keyboard: you move the cursor, the focus shifts, and the automated magic won’t work.

## What a driver can do
In our Json Wire Protocol implementation we were guided by two drafts of a protocol that are used by WebDriver: [JsonWireProtocol](https://code.google.com/p/selenium/wiki/JsonWireProtocol) and a newer [webdriver-spec](https://w3c.github.io/webdriver/webdriver-spec.html).
By now we have implemented the majority of the most popular commands.

<div class="collapse-next">
    <strong>Click to show the complete list</strong>
</div>

|Command | Query|
| ------------- | ------------- |
|NewSession | POST /session|
|FindElement | POST /session/:sessionId/element|
|FindChildElement | POST /session/:sessionId/element/:id/element|
|ClickElement | POST /session/:sessionId/element/:id/click|
|SendKeysToElement | POST /session/:sessionId/element/:id/value|
|GetElementText | GET /session/:sessionId/element/:id/text|
|GetElementAttribute | GET /session/:sessionId/element/:id/attribute/:name|
|Quit | DELETE /session/:sessionId|
|ClearElement | POST /session/:sessionId/element/:id/clear|
|Close | DELETE /session/:sessionId/window|
|ElementEquals | GET /session/:sessionId/element/:id/equals/:other|
|ExecuteScript | POST /session/:sessionId/execute|
|FindChildElements | POST /session/:sessionId/element/:id/elements|
|FindElements | POST /session/:sessionId/elements|
|GetActiveElement | POST /session/:sessionId/element/active|
|GetElementSize | GET /session/:sessionId/element/:id/size|
|ImplicitlyWait | POST /session/:sessionId/timeouts/implicit_wait|
|IsElementDisplayed | GET /session/:sessionId/element/:id/displayed|
|IsElementEnabled | GET /session/:sessionId/element/:id/enabled|
|IsElementSelected | GET /session/:sessionId/element/:id/selected|
|MouseClick | POST /session/:sessionId/click|
|MouseDoubleClick | POST /session/:sessionId/doubleclick|
|MouseMoveTo | POST /session/:sessionId/moveto|
|Screenshot | GET /session/:sessionId/screenshot|
|SendKeysToActiveElement | POST /session/:sessionId/keys|
|Status | GET /status|
|SubmitElement | POST /session/:sessionId/element/:id/submit|

Here’s an example of some simple commands’ usage (Python):

<ol>
    <li>When a driver is being created, we launch the app with a NewSession command:
{% highlight python %}
driver = webdriver.Remote(
  command_executor='http://localhost:9999',
  desired_capabilities={
  "app": r"C:/windows/system32/calc.exe"
})
{% endhighlight %}
    </li>
    <li>We then find the window of the application to be tested using a FindElement command:
    {% highlight python %}window = driver.find_element_by_class_name('CalcFrame'){% endhighlight %}
    </li>
    <li>After that we find the element in the window with a FindChildElement command:
    {% highlight python %}result_field = window.find_element_by_id('150'){% endhighlight %}
    </li>
    <li>Then we get an element property with a GetElementAttribute command:
    {% highlight python %}result_field.get_attribute('Name'){% endhighlight %}
    </li>
    <li>Finally, we close the application with a Quit command:
    {% highlight python %}driver.quit(){% endhighlight %}
    </li>
</ol>

Same in C#:

{% highlight c# %}
var dc = new DesiredCapabilities();
dc.SetCapability("app", @"C:/windows/system32/calc.exe");
var driver = new RemoteWebDriver(new Uri("http://localhost:9999"), dc);

var window = driver.FindElementByClassName("CalcFrame");
resultField = window.FindElement(By.Id("150"));
resultField.GetAttribute("Name");

driver.Quit();
{% endhighlight %}

You can get more detailed information about the supported commands on our wiki, which is located in the project repository.

## Working with elements
In order to control elements in tests one should be able to find them first. The elements are searched by locators (properties that are unique to elements).

You can get the elements’ locators by [UISpy](https://github.com/2gis/Winium.Cruciatus/tree/master/tools/UISpy), [Inspect](https://msdn.microsoft.com/en-us/library/windows/desktop/dd318521(v=vs.85).aspx) (newer version of UISpy) or [UIAVerify](https://msdn.microsoft.com/en-us/library/windows/desktop/jj160544(v=vs.85).aspx). The latter two are installed together with Visual Studio, and located in ```“%PROGRAMFILES(X86)%\Windows Kits\8.1\bin\”``` directory (it can be different for different versions of Windows Kits).

It is recommended to launch any of those tools as administrator.
We recommend you to use UIAVerify. It has the highest efficiency and is the most convenient one, in our opinion.

Cruciatus can search for elements by any property from AutomationElementIdentifiers class, Winium.Desktop supports only three search strategies (locator types):

- AutomationProperties.AutomationId;
- Name;
- ClassName.

Desktop is the root element of the search. It is recommended first to look for a window of the application to be tested (FindElement) and only afterwards search for its child elements (FindChildElement).

In this case it is necessary to expand the available [search strategies](https://github.com/2gis/Winium.Desktop/wiki/Finding-Elements), email us, or do not hesitate to create [a new issue](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2F2gis%2FWinium.Desktop%2Fissues%2Fnew).


Example. A code that can code.

{% highlight python %}
{% raw %}
from selenium import webdriver
from selenium.webdriver import ActionChains
import time

driver = webdriver.Remote(
 command_executor='http://localhost:9999',
 desired_capabilities={
 'app': r'C:\Program Files (x86)\Microsoft Visual Studio 12.0\Common7\IDE\devenv.exe'
 })

window = driver.find_element_by_id('VisualStudioMainWindow')
menu_bar = window.find_element_by_id('MenuBar')

menu_bar.click()
menu_bar.find_element_by_name('File').click()
menu_bar.find_element_by_name('New').click()
menu_bar.find_element_by_name('Project...').click()

project_name = 'SpecialForHabrahabr-' + str(time.time())
new_project_win = window.find_element_by_name('New Project')
new_project_win.find_element_by_id('Windows Desktop').click()
new_project_win.find_element_by_name('Console Application').click()
new_project_win.find_element_by_id('txt_Name').send_keys(project_name)
new_project_win.find_element_by_id('btn_OK').click()

text_view = window.find_element_by_id('WpfTextView')
text_view.send_keys('using System;{ENTER}{ENTER}')

actions = ActionChains(driver)
actions.send_keys('namespace Habrahabr{ENTER}')
actions.send_keys('{{}{ENTER}')
actions.send_keys('class Program{ENTER}')
actions.send_keys('{{}{ENTER}')
actions.send_keys('static void Main{(}string{[}{]} args{)}{ENTER}')
actions.send_keys('{{}{ENTER}')
actions.send_keys('Console.WriteLine{(}\"Hello Habrahabr\"{)};')

actions.send_keys('^{F5}')
actions.perform()
{% endraw %}
{% endhighlight %}

## Continuous Integration for Winium.Desktop tests
Tests that are run by a Winium.Desktop driver are included into a CI project in a standard manner. A real or a virtual machine is necessary for that. When setting up a machine for CI one should follow some formalities.

First, the system needs a so-called active desktop. It is available on your computer or when connected by RDP. Note that, it is not allowed to minimize the connection window. One can use [Autologon](https://technet.microsoft.com/ru-ru/sysinternals/bb963905.aspx) for an automated creation of an active desktop.

Second, you must keep the desktop active. In order to do that you should set up the machine power settings (for the user who uses Autologon). Cancel the display power-off and hibernation mode. If you are using an RDP connection, you should reboot the machine when the connection is done. It will resume the active desktop. In order to keep an eye on the tests one can use [System Center App Controller](https://technet.microsoft.com/ru-ru/library/hh546834.aspx) or [VNC](https://ru.wikipedia.org/wiki/Virtual_Network_Computing).

Third, your build server agent must run as a process, not as a service. This limitation is due to the fact that services in Windows are not allowed to run a user interface applications (i.e. services can not access desktop).

To sum it up: set Autologon up, keep the desktop active and run the build server agent as a process.

## Conclusion
Winium.Desktop project enabled us to blur the distinction between automated UI testing of web and desktop applications.

Testers are now  free to share their Selenium experiences and best practices. The automated tests that have been written for totally different platforms can be executed in one cloud infrastructure based on Selenium-Grid.

And again: [a link to repository](https://github.com/2gis/Winium.Desktop) and [other opensource 2GIS products](http://techno.2gis.ru/opensource).

Gleb Golovin, 2GIS.
