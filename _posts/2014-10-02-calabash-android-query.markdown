---
layout: post
title:  Calabash Android - Unleash the power of Query
author: Sathish Gogineni
date:   2014-10-02
categories: automation mobile qa android calabash
---

Calabash provides **query** method to get views/elements from screen. But *query* can do more than this. In this post, I will go through few operations we can perform using the query **method invocation** option. This can be used from updating simple views to call system services.

You can read basics of the query operations in [Calabash wiki](https://github.com/calabash/calabash-android/wiki/05-Query-Syntax). As opposed to just getting results from screen, we can use the *query* method to update views. This can be simple a `EditText` or a `DatePicker`.

Please download the application from [Calabash Test]({{page.filesdir}}/CalabashTest.apk) and open the calabash console. You can try the examples as you go along

{% highlight sh %}
$ calabash-android console CalabashTest.apk
irb(main):001:0> reinstall_apps
=> nil
irb(main):002:0> start_test_server_in_background
=> nil
{% endhighlight %}

I have created a sample registeration screen which looks similar to Badoo. I will talk about how to enter data in this form using method invocation.

![]({{page.imgdir}}/registration_screen.jpg)

# Input fields

`EditText` are used as input text fields in Android. You can enter the email into `EditText` by running the following command.

{% highlight sh %}
irb(main):001:0> query("EditText id:'email_input'",:setText=>'me@badootech.london')
{% endhighlight %}

The [EditText Api](http://developer.android.com/reference/android/widget/EditText.html) has a `setText()` method which takes a single argument (actually inherited from TextView). In the above example, we invoke the same operation with a string value.

Arguments passed to `query` works in chain direction. Each argument is invoked on the previous argument result. To read more about query directions, check this post: [Query Direction and Layouts](http://krazyrobot.com/2014/04/calabash-android-query-direction-and-layouts/).

Whenever we want to invoke a method with single argument, we can call on selected view with syntax `:operation=><value>`. It is important to pass the value correctly to the operation: if it is a string, it should be passed with single/double quotes.

You can get the text value of a view by invoking the `getText()` method. If the method has no arguments, then you can call on selected view with syntax `:operation`.

{% highlight sh %}
irb(main):001:0> query("EditText id:'email_input'",:getText)
{% endhighlight %}

The query also has a more shorter version to invoke the 'get' operation. Try this:

{% highlight sh %}
irb(main):001:0> query("EditText id:'email_input'",:text)
{% endhighlight %}

When you call `:operation` without 'get', it tries to find one of the methods `operation` , `getOperation` or `isOperation` on the view and invokes the first available operation.

# Update CheckBox and RadioButton

`CheckBox` and `RadioButton` inherit from a common view and both have the method [setChecked](http://developer.android.com/reference/android/widget/Checkable.html#setChecked(boolean)), which take a boolean value (true or false).

{% highlight sh %}
irb(main):001:0> query("CheckBox id:'check_update'",:setChecked=>true)
{% endhighlight %}

Here we are passing true/false value without quotes since the method is expecting a boolean value. Similarly, you can select the gender in the registration screen by using one the following queries:

{% highlight sh %}
irb(main):001:0> query("RadioButton id:'radio_male'",:setChecked=>true)
irb(main):001:0> query("RadioButton id:'radio_female'",:setChecked=>true)
{% endhighlight %}

It is highly recommended to use the touch operation for the selection of these views (it may trigger `onClick()` call back implemented in the app code) but you can also invoke these methods.

To get the value of the check box, we should invoke the `isChecked()` method. If you call `:checked`, it will eventually find the `isChecked()` method and call it.

{% highlight sh %}
irb(main):001:0> query("CheckBox id:'check_update'",:isChecked)
irb(main):001:0> query("CheckBox id:'check_update'",:checked)
{% endhighlight %}

# Set rating on RatingBar

`RatingBar` is one of the views where it is difficult to trigger touch operations. It is more easy to invoke the method to set the desired value.

{% highlight sh %}
irb(main):001:0> query("RatingBar",setProgress:4)
{% endhighlight %}

And to get the value of the `RatingBar`

{% highlight sh %}
irb(main):001:0> query("RatingBar",getProgress)
{% endhighlight %}

# Set date in DatePicker

So far we have seen methods with a single argument. Now I will explain about the methods with multiple arguments and for that the best example is `DatePicker`. First, touch date display view to open the data picker dialog.

{% highlight sh %}
irb(main):001:0> touch("* id:'dob_text'")
{% endhighlight %}

You can do `query(“*”)` to find all the elements on the date picker dialog. The main element is the one with id ‘datePicker’

{% highlight sh %}
irb(main):001:0> query("DatePicker id:'datePicker'")
{% endhighlight %}

In the Android Api, DatePicker has the [updateDate](http://developer.android.com/reference/android/widget/DatePicker.html#updateDate(int, int, int)) method with three arguments `year`, `month` and `day`. To set the date, we should call this method on the `DatePicker` view.

Now set any date for ex: 30-11-1990 (day-month-year) by running the following query

{% highlight sh %}
query("datePicker",:method_name =>'updateDate',:arguments =>[1990,11,30])
{% endhighlight %}

Query has the option to specify method_name and arguments to invoke on a view. Arguments should be passed as an array. This approach can also be used for a single argument.

Now you can also try this way to set the values for `EditText`, `CheckBox` or `RatingBar`

{% highlight sh %}
query("RatingBar",:method_name=>'setProgress', :arguments=>[5])
query("EditTextid:'email_input'",
          :method_name=>'setText',:arguments=>['me@badootech.london'])
{% endhighlight %}

Similarly, to call methods with no arguments, the arguments value should be an empty array:

{% highlight sh %}
query("EditTextid:'email_input'", :method_name=>'getText',:arguments=>[])
query("RatingBar",:method_name=>'getProgress', :arguments=>[])
{% endhighlight %}

# Summary

In calabash, query is a powerful tool to interact with views. It uses Java reflection internally to invoke operations on views. It can also be used on custom views. It is important to know the method and its argument types before calling it. Unfortunately Calabash doesn’t provide proper error messages for method invocation, so passing the wrong number of arguments or argument types won’t update the view.

But this is not all. Query can do much more than this. In the next post, I will explain how query can be used to interact with system services to get more details about the device. If you need methods for other views or something that is not clear in this post, please help me make it better by giving me your feedback in the comments.