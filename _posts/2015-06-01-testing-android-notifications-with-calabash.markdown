---
layout: post
title: Testing Android notifications in Calabash
author: Tim Baverstock
date: 2015-06-01
categories: android qa
---

It's generally understood that Calabash can only operate controls that are part of the application it's testing, but this limitation is particularly annoying with status bar notifications. 

We would like to write something like this at the feature level:

{% highlight gherkin %}
Given I press home
And I verify no notification with "You got an award on Badoo!"
And the server sends me an "award" notification
When I click a notification with "Badoo Award" and "You got an award on Badoo!"
Then I verify I am on the award screen
{% endhighlight %}

*We click 'home' here with `adb shell input keyevent KEYCODE_HOME` because Badoo has special handling when notifications arrive while the app is open; your needs may differ.*

The step definition is trivial:

{% highlight ruby %}
When(/^I click a notification with "([^"]*?)"(:? and "([^"]*)")?(?: within (\d+) seconds?)?$/) do |text1, text2, timeout|
 click_notification_matched_by_full_text(
(timeout || 1).to_f * 1000, text1, text2)
end
{% endhighlight %}

but the implementation is the key

## An indirect approach

Even if you could look at and click on the notifications, there is an argument that you should only test things which are under your direct control. If, for instance, the user interface of Android's notification mechanism changes radically (e.g. phones vs tablets) it will at the least break your tests, and at worst make them impossible to mend.

One indirect route to checking notifications involves adding a special test mode to the application code that generates notifications, to keep a list of notifications instead of posting them and allowing Calabash to retrieve that list. Calabash can then make assertions about the notification data and issue the intents, to ensure that the application responds correctly. Intents don't care whether they're launched by a notification being pressed, so you could test them at multiple points in your app without having to re-generate the notification, if it makes sense to do so.

You might object that this isn't doing a full round-trip through the notification system so something could go wrong, and you'd be strictly correct, but how often do you change the code that sits between generating a notification and posting it? Do you need to test that every time, if the text and intent given to it are checked? Consider this a form of dependency injection - 'injecting' a testable notification mechanism.

## A direct approach

There is a more direct route to checking notifications that you may find useful, and it's the one we're using for now because it suits our immediate needs.

Everyone knows that Calabash isn't limited to talking to the phone through its server: most solutions to testing notifications suggest examining the output of `adb shell dumpsys notifications` to see whether the notification is being displayed, but as mentioned above it's just as important to test that the pressing of a notification ends up in the correct part of the application.

Calabash can invoke `adb shell uiautomator dump` on Jellybean (4.1) and later devices to retrieve an XML document describing the current display. This isn't particularly fast as an operation, but most applications only have a few notifications to test, so it's a reasonable trade-off. It's possible to combine that view list with `adb input swipe` to open the notification drawer (on a phone; tablets are more varied) or dismiss a notification, and `adb input tap` to press the notification (or the action buttons on the notification, if you're feeling fancy). Again, not the fastest or most elegant solution, but it's workable.

A particularly nice aspect of uiautomator's XML is how easy it makes finding a notification with two strings - you only need a simple xpath: 

{% highlight javascript %}
//node[./node/node[@text='Badoo Award']][./node/node[@text='You got an award on Badoo!']]
{% endhighlight %}

## Code

What follows is our initial code, and should serve as a reasonable starting point.

### UIAutomator

Retrieving the UIAutomator dump requires a couple of calls: one to create the dump, and one to get it off the phone. I'm using `adb shell cat` instead of `adb pull` because it saves managing temporary files on the host machine.

{% highlight ruby %}
def uiautomator_dump
 stdout, stderr, status = exec_adb('shell uiautomator dump')
 unless /dumped to: (?<file>\S*)/ =~ stdout
   fail "uiautomator dump failed? Returned #{stdout} :: #{stderr}"
 end
 stdout, stderr, status = exec_adb("shell cat #{file}")
 [stdout, stderr, status]
end
{% endhighlight %}

We wish to identify a notification by its text strings - it might have one or two. This function builds an xpath for a node whose grandchildren have the given texts - works for us for now, but obviously notification layouts aren't guaranteed to follow this pattern in future releases.

{% highlight ruby %}
def xpath_for_full_path_texts(params)
 texts = params.keys.grep(/^notification.full./)
 clauses = texts.collect { |k| "./node/node[@text='#{params[k]}']" }
 "//node[#{clauses.join('][')}]"
end
{% endhighlight %}

The UIAutomator dump is mostly <node> elements containing other <node> elements, and they all have a 'bounds' attribute giving the left, top, right, and bottom edges of the view rectangles. This method extracts the bounds. (It actually takes the first from a set of nodes, returned from the xpath call.)

{% highlight ruby %}
def extract_integer_bounds(set)
 return nil if set.empty?
 match = (set.attr('bounds').to_s.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/))
 match.captures.collect(&:to_i)
end
{% endhighlight %}

This allows us to run a block of code with the bounds of the first node selected by an xpath - note that the output of uiautomator can involve overlapping views, and it's not always easy to determine whether a view is effectively clickable. *Our more complicated version of this routine clips children to their parents' rectangles (to account for scrollviews) and checks for potentially overlapping siblings of each ancestor up to the root (we ignore siblings larger than half the size of the parent).*

{% highlight ruby %}
def bounds_from_xpath(xpath)
 stdout, _stderr, _status = uiautomator_dump
 set = Nokogiri::XML(stdout).xpath(xpath)
 if (bounds = extract_integer_bounds(set))
   return yield bounds
 else
   return nil
 end
end
{% endhighlight %}

### Interacting with the phone

We interact with the phone through `adb input` because it's easy and portable.

This function opens the notification shutter on most phones by swiping down from the top (needs improving for tablets):

{% highlight ruby %}
def open_notification_shutter
 bounds_from_xpath('//node[1]') do |x1, y1, x2, y2|
   xm = (x1 + x2) >> 1
   exec_adb("shell input swipe #{xm} #{y1} #{xm} #{y2}")
 end
end
{% endhighlight %}

This taps a notification (and ensures that the notification shutter is closed)

{% highlight ruby %}
def tap_notification(xpath)
 found_bounds = bounds_from_xpath(xpath) do |x1, y1, x2, y2|
   ym = (y1 + y2) >> 1
   exec_adb("shell input tap #{(x1 + x2) >> 1} #{ym}")
 end
 dismissed = !found_bounds.nil?
 keyboard_enter_keyevent('KEYCODE_BACK') unless dismissed
 return dismissed
end
{% endhighlight %}

This swipes a notification to dismiss it and then ensures the notification shutter is closed

{% highlight ruby %}
def dismiss_notification(xpath)
 found_bounds = bounds_from_xpath(xpath) do |x1, y1, _x2, y2|
   ym = (y1 + y2) >> 1
   exec_adb("shell input swipe #{x1} #{ym} 10000 #{ym}")
 end
 found_bounds.nil?
end
{% endhighlight %}

### Implementing the step

This combines the above code to tap or dismiss a notification, with retry logic if it hasn't yet been received. *The code could be simpler (particularly parameter handling), but we have a Lollipop-specific code path not shown in this article that uses an instrumentation to invoke `UiDevice.openNotification()` and related Android calls for more reliable testing on tablets.*

{% highlight ruby %}
def handle_notification(params)
 xpath = xpath_for_full_path_texts(params)
 timeout = params['timeout'].to_i
 start = Time.new
 while start + timeout / 1000 > Time.new
   open_notification_shutter
   if params['action.click']
     break if tap_notification(xpath)
   else
     break if dismiss_notification(xpath)
   end
 end
end

def click_notification_matched_by_full_text(timeout, *strings)
 h = { 'timeout' => timeout.to_s, 'action.click' => 'true' }
 strings.map.with_index { |v, i| h["notification.full.#{i}"] = v if v }
 handle_notification(h)
end

def dismiss_notification_matched_by_full_text(timeout, *strings)
 h = { 'timeout' => timeout.to_s, 'action.dismiss' => 'true' }
 strings.map.with_index { |v, i| h["notification.full.#{i}"] = v if v }
 handle_notification(h)
end
{% endhighlight %}

### For completeness, the adb functions:

{% highlight ruby %}
def exec_adb(cmd)
 adb_cmd = "#{default_device.adb_command} #{cmd}"
 stdout, stderr, status = Open3.capture3(adb_cmd)
 unless status.success?
   fail "Adb failed: #{adb_cmd} Returned #{stdout} :: #{stderr}"
 end
 [stdout, stderr, status]
end

def keyboard_enter_keyevent(keyevent)
 exec_adb("shell input keyevent #{keyevent}")
end
{% endhighlight %}

