---
layout: post
title:  Calabash Android - Unleash the power of Query
author: Sathish Gogineni
date:   2014-10-02
categories: automation mobile qa android calabash
---

Calabash provided **query** method to get views/elements from screen. But *query* can do more than this. In this post, I will go through few  operations we can perform using the query **method invocation** option. This can be used to update from a simple views to call system services.

You can read basics of the query operations in [Calabash wiki](https://github.com/calabash/calabash-android/wiki/05-Query-Syntax). As opposed to just getting results from screen, we can use the *query* method to update views. This can be simple EditText or a DatePicker.

Please download the application from [Calabash Test]({{page.filesdir}}/CalabashTest.apk) and open the calabash console. You can try the examples as you go along

{% highlight sh %}
$ calabash-android console CalabashTest.apk
irb(main):001:0> reinstall_apps
=> nil
irb(main):002:0> start_test_server_in_background
=> nil
{% endhighlight %}

I have created a sample registeration screen which looks similar to Badoo. I will talk about how to enter data in this sample registration form using method invocation.

![]({{page.imgdir}}/registration_screen1.jpg)

# Input fields

`EditText` are used as input text fields in Android. You can enter the email into `EditText` by running the following command.

{% highlight sh %}
irb(main):001:0> query("EditText id:'email_input'",:setText=>'me@badootech.london')
{% endhighlight %}

In [EditText Api](http://developer.android.com/reference/android/widget/EditText.html), it has setText method with single argument (actually inherited from TextView). In the above example, we invoke the same operation with string value.

Arguments passed on query works in chain direction.Each argument invokes on previous argument result. To ready more about query directions, check this post [Query Direction and Layouts](http://krazyrobot.com/2014/04/calabash-android-query-direction-and-layouts/)

Whenever, we want to invoke a method with single argument, we can call on selected view with syntax `:operation=><value>`. It is important how value is passing to the operation. if it is string , it should pass with single/double quotes

You can get the text value of view by invoking getText method. If method has no arguments, then you call on selected view with syntax `:operation`

{% highlight sh %}
irb(main):001:0> query("EditText id:'email_input'",:getText)
{% endhighlight %}

query also has more shorter version to invoke the 'get' operation. try this

{% highlight sh %}
irb(main):001:0> query("EditText id:'email_input'",:text)
{% endhighlight %}

When you call `:operation` without 'get', it tries to find one of the operation `operation` , `getOperation` or `isOperation` on the view and invoke the first available operation

# Update CheckBox and RadioButton

CheckBox and RadioButton are inherited from a common view and both has method [setChecked](http://developer.android.com/reference/android/widget/Checkable.html#setChecked(boolean)) with expected boolean value (true or false )

{% highlight sh %}
irb(main):001:0> uery("CheckBox id:'check_update'",:setChecked=>true)
{% endhighlight %}

Here we are passing true/false value without quotes since it is expecting boolean value. Similarly, you can select gender in registration screen by using one the following query

{% highlight sh %}
irb(main):001:0> query("RadioButton id:'radio_male'",:setChecked=>true)
irb(main):001:0> query("RadioButton id:'radio_female'",:setChecked=>true)
{% endhighlight %}

It is most recommended to use touch operation for selection of these views ( it may trigger onClick operation implemented in app code ) but you can also invoke these methods.

To get the value of check box, we should invoke `isChecked` method. If you call, `checked`, it eventually find isChecked method and call it.

{% highlight sh %}
irb(main):001:0> query("CheckBox id:'check_update'",:isChecked)
irb(main):001:0> query("CheckBox id:'check_update'",:checked)
{% endhighlight %}

# Set rating on RatingBar

RatingBar is one of the view which is difficult to use touch operation. It is more easy to invoke method to set the desired value.

{% highlight sh %}
irb(main):001:0> query("RatingBar",setProgress:4)
{% endhighlight %}

And to get the value of the RatingBar

{% highlight sh %}
irb(main):001:0> query("RatingBar",getProgress)
{% endhighlight %}

# Set date in DatePicker

So far we have seen method with single argument, Now I will explain about the methods with multiple arguments and for that the best example is DatePicker. First, touch date display view to open the data picker dialog.

{% highlight sh %}
irb(main):001:0> touch("* id:'dob_text'")
{% endhighlight %}

You can do `query(“*”)` to find all the elements on date picker dialog. The main element is the one with id ‘datePicker’

{% highlight sh %}
irb(main):001:0> query("DatePicker id:'datePicker'")
{% endhighlight %}

In Android Api, DatePicker has the [updateDate](http://developer.android.com/reference/android/widget/DatePicker.html#updateDate(int, int, int)) method with three arguments year, month and day. To set the date, we should call this method on datePicker view

Now set any date for ex: 30-11-1990 (day-month-year) by running the following command

{% highlight sh %}
query("datePicker",:method_name =>'updateDate',:arguments =>[1990,11,30])
{% endhighlight %}

Query has the option to specify method_name and arguments to invoke on view. Arguments should pass as an array. This appraoch can also be used

Now you can also try this way to set the values for EditText, CheckBox or RatingBar

{% highlight sh %}
query("RatingBar",:method_name=>'setProgress', :arguments=>[5])
query("EditTextid:'email_input'",
          :method_name=>'setText',:arguments=>['me@badootech.london'])
{% endhighlight %}

Similarly, To call method with no arguments, arguments value should be an empty array

{% highlight sh %}
query("EditTextid:'email_input'", :method_name=>'getText',:arguments=>[])
query("RatingBar",:method_name=>'getProgress', :arguments=>[])
{% endhighlight %}

# Summary

In calabash, query is a powerful tool to interact with views. It uses Java reflexion internally to invoke operations on views. It can also be used on custom views. It is important to know the method and it’s argument types before calling it. Unfortunately Calabash doesn’t provide proper error messages for method invocation, passing the wrong number of arguments or argument types won’t update the view.

But this is not all. Query can do much more than this. In the next post, i will explain how query can be used to interact with system services to get more details about the device. If you need methods for other views or something is not clear in this post, please help me make it better by giving me your feedback in the comments.