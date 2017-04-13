---
layout: post
title: A small but extremely useful patch for Selenium
author: Artem Soldatkin
date: 2017-04-18
categories: Testing Mobile-app Java
excerpt: Around six months ago, the number of tests and tasks grew to the point where our little Selenium farm was struggling with the number of requests from new Firefox or Chrome sessions at peak times.
---
Within our small, yet dynamically developing company we test hundreds of tasks every day. They are all checked in test environments as well as in environments which are closer to real situations. The vast majority of tasks connected with the web are checked using our wide range of autotests.

Around six months ago, the number of tests and tasks grew to the point where our little Selenium farm was struggling with the number of requests from new Firefox or Chrome sessions at peak times. It looked something like this: a queue builds up on the Selenium grid from sessions waiting for a free browser.  Users continue to launch autotests, and this queue continues to grow, while browsers busy with old tasks and sessions lag behind with timeouts.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

At that time, the maximum number of nodes divided between Firefox, Chrome, Internet Explorer and PhantomJS was around 200. One of the options I came up with for solving this problem was to monitor the number of free nodes prior to testing and then hold tests back using setUp() until more free nodes became available.

<a href="https://github.com/SeleniumHQ/selenium/blob/2aa21c1bca3ce863ed19791e20606a007a17dfa7/java/CHANGELOG">In the description of changes to Selenium</a>, a function for receiving information from the SeleniumGrid using HTTP requests snuck in. You can take a look at the available commands <a href="https://github.com/SeleniumHQ/selenium/blob/1c339290e142cab0ab6d7989e5ad2be4da118cb3/java/server/src/org/openqa/grid/web/servlet/HubStatusServlet.java">directly within the servlet code at HubStatusServlet.java</a>. There are three in total: *configuration, slotCounts* (number of slots) and *newSessionRequestCount* (the number of sessions in the queue for acceptance by the browser).

The format of the request is pretty nifty: it’s a GET request with a body. For the tests we’ll use cURL and check what the command will return:

{% highlight html %}

$ curl -XGET http://selenium1:5555/grid/api/hub -d '{"configuration":[]}'

{
	'success': true,
	'port': '5555',
	'hubConfig': '/usr/local/selenium-rc/grid.json',
	'host': 'selenium1',
	'servlets': 'org.openqa.grid.web.servlet.HubStatusServlet',
	'cleanUpCycle': 5000,
	'browserTimeout': 120000,
	'newSessionWaitTimeout': 30000,
	'capabilityMatcher': 'org.openqa.grid.internal.utils.DefaultCapabilityMatcher',
	'prioritizer': null,
	'throwOnCapabilityNotPresent': true,
	'nodePolling': 5000,
	'maxSession': 5,
	'role': 'hub',
	'jettyMaxThreads': - 1,
	'timeout': 90000
}

$ curl -XGET http://selenium1:5555/grid/api/hub -d '{"configuration":["slotCounts"]}'

{
	'success': true,
	'slotCounts': {
    	'free': 50,
    	'total': 196
	}
}

curl -XGET http://selenium1:5555/grid/api/hub -d '{"configuration":["newSessionRequestCount"]}'

{
	'success': true,
	'newSessionRequestCount': 3
}

{% endhighlight %}

In our company, all tests for Selenium are written in PHP and a similar request here will look like this:

{% highlight html %}

<?php

$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, 'http://selenium1:5555/grid/api/hub');
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'GET');
curl_setopt($curl, CURLOPT_POSTFIELDS, '{"configuration":["slotCounts"]}');
curl_exec($curl);

{% endhighlight %}

In theory, tests requested in setUp() for a defined number of slots and waiting sessions could be put on hold. However, this is not so convenient if your resources are unevenly distributed over different browsers. For example, at Badoo the number of nodes for Firefox is a third larger than those for Chrome, Internet Explorer and MS Edge which use only around 10 nodes (and these can be divided by version). It looks like there are probably no more nodes left for Chrome, although Selenium Grid says that there are still free nodes available.

So, we had to write a function into the servlet to understand which browsers are available and in what quantity. <a href="https://github.com/leipreachan/selenium/commit/8e97d913fe3ef519973e21c4b3beb22d055881d6?diff=unified">The patch itself is fairly small, and here is the code</a>:

{% highlight html %}

diff --git a/java/server/src/org/openqa/grid/web/servlet/HubStatusServlet.java b/java/server/src/org/openqa/grid/web/servlet/HubStatusServlet.java
index 8b9c578..550c5db 100644
--- a/java/server/src/org/openqa/grid/web/servlet/HubStatusServlet.java
+++ b/java/server/src/org/openqa/grid/web/servlet/HubStatusServlet.java
@@ -29,10 +29,12 @@
 import org.openqa.grid.internal.Registry;
 import org.openqa.grid.internal.RemoteProxy;
 import org.openqa.grid.internal.TestSlot;
+import org.openqa.selenium.remote.CapabilityType;

 import java.io.BufferedReader;
 import java.io.IOException;
 import java.io.InputStreamReader;
+import java.util.HashMap;
 import java.util.HashSet;
 import java.util.Map;
 import java.util.Set;
@@ -128,6 +130,11 @@ private JsonObject getResponse(HttpServletRequest request) throws IOException {
           paramsToReturn.remove("slotCounts");
     	}

+    	if (paramsToReturn.contains("browserSlotsCount")) {
+ 	     res.add("browserSlotsCount", getBrowserSlotsCount());
+          paramsToReturn.remove("browserSlotsCount");
+    	}
+
     	for (String key : paramsToReturn) {
       	Object value = allParams.get(key);
       	if (value == null) {
@@ -169,6 +176,53 @@ private JsonObject getSlotCounts() {
 	return result;
   }

+  private JsonObject getBrowserSlotsCount() {
+	int freeSlots = 0;
+	int totalSlots = 0;
+
+	Map<String, Integer> freeBrowserSlots = new HashMap<>();
+	Map<String, Integer> totalBrowserSlots = new HashMap<>();
+
+	for (RemoteProxy proxy : getRegistry().getAllProxies()) {
+  	for (TestSlot slot : proxy.getTestSlots()) {
+    	String
+      	slot_browser_name =
+          slot.getCapabilities().get(CapabilityType.BROWSER_NAME).toString().toUpperCase();
+    	if (slot.getSession() == null) {
+      	if (freeBrowserSlots.containsKey(slot_browser_name)) {
+            freeBrowserSlots.put(slot_browser_name, freeBrowserSlots.get(slot_browser_name) + 1);
+      	} else {
+            freeBrowserSlots.put(slot_browser_name, 1);
+      	}
+      	freeSlots += 1;
+    	}
+    	if (totalBrowserSlots.containsKey(slot_browser_name)) {
+          totalBrowserSlots.put(slot_browser_name, totalBrowserSlots.get(slot_browser_name) + 1);
+    	} else {
+          totalBrowserSlots.put(slot_browser_name, 1);
+    	}
+    	totalSlots += 1;
+  	}
+	}
+
+	JsonObject result = new JsonObject();
+
+	for (String str : totalBrowserSlots.keySet()) {
+  	JsonObject browser = new JsonObject();
+      browser.addProperty("total", totalBrowserSlots.get(str));
+  	if (freeBrowserSlots.containsKey(str)) {
+        browser.addProperty("free", freeBrowserSlots.get(str));
+  	} else {
+    	browser.addProperty("free", 0);
+  	}
+  	result.add(str, browser);
+	}
+
+    result.addProperty("total", totalSlots);
+    result.addProperty("total_free", freeSlots);
+	return result;
+  }
+
   private JsonObject getRequestJSON(HttpServletRequest request) throws IOException {
 	JsonObject requestJSON = null;
 	BufferedReader rd = new BufferedReader(new InputStreamReader(request.getInputStream()));

{% endhighlight %}

We apply the patch to the local copy of sources for Selenium, with our own build of the SeleniumGrid (<a href="https://github.com/SeleniumHQ/selenium">more detailed instructions on the build here</a>). If you’re not up for tinkering with the build, you can try one I’ve already made here: <a href="https://github.com/leipreachan/misc_scripts/tree/master/blob/selenium">https://github.com/leipreachan/misc_scripts/tree/master/blob/selenium</a>
Now let’s restart the selenium grid and see which values it returns:

{% highlight html %}

curl -XGET http://selenium1:5555/grid/api/hub -d '{"configuration":["browserSlotsCount"]}'

{% endhighlight %}

and the result:

{% highlight html %}

{
	'success': true,
	'browserSlotsCount': {
    	'IEXPLORER': {
        	'total': 4,
        	'free': 3
    	},
    	'FIREFOX': {
        	'total': 95,
        	'free': 50
    	},
    	'MICROSOFTEDGE': {
        	'total': 1,
        	'free': 1
    	},
    	'PHANTOMJS': {
        	'total': 20,
        	'free': 20
    	},
    	'CHROME': {
        	'total': 76,
        	'free': 75
    	},
    	'total': 196,
    	'total_free': 149
	}
}

{% endhighlight %}

So now we know which browsers are free and in what quantity they are shown in the Selenium Grid.  All that remains is to check the setup() method (or similar):

- carry out a check for the number of free nodes;
- in this test, we added a short waiting period (for example, two minutes) before the test times out;
- remember that these parameters don’t need to be requested every second.

For us, it now looks like Selenium tests run a little slower at peak hours, but are overall far more stable. Considering that we have several hundred tests launching automatically, this idea has made life a lot simpler for those in our company working on tests.

**Artem Soldatkin, Lead QA Engineer.**
