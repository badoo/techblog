---
layout: post
title: The painless way to collect statistics from a web-site
author: Vyacheslav Volkov
date:   2017-05-17
categories: JavaScript Website-development
excerpt: We know that analytics allows you to assess how effectively any web-site operates, to improve how it operates, and therefore to raise the level of sales and to improve user interaction with the site. But what do you do if the standard monitoring tools are inadequate?
---
<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

We know that analytics allows you to assess how effectively any web-site operates, to improve how it operates, and therefore to raise the level of sales and to improve user interaction with the site. To put it more simply, analytics is a way of controlling processes which occur on a web-site. In most cases for ordinary sites it is sufficient to install Google Analytics or, in Russia, Yandex.metrika – the possibilities they afford are entirely adequate.

But what do you do if the standard monitoring tools are inadequate? Or if the statistics collected have to be integrated into your own analytics system to provide a full picture of what is going on between components? In this case, you probably need to develop your own system. How best to send statistics from your web-sites, what problems can occur in this regard and how to avoid them – that is what I want to talk about in this article. Interested? Then, scroll down.

For services such as Badoo, any statistics represent a very important means for assessing the current situation. They provide detailed information on the resource in question, whether it be user clicks, blocks which the user has viewed, actions they have performed or errors which have occurred when working with the site. Based on this information, we monitor how the site is working. We then take decisions which will determine which new features there will be, how the blocks can be moved around on the page and other changes. For this reason, we work with a huge quantity of statistics of a diverse nature. What difficulties might one encounter with such a message flow?

The first problem which may occur is that browser have limitations in respect of the number of connections to  a domain at any one time. For example, when a page is loading, we make four Ajax requests to obtain data (download fonts, SVG-graphics) and load dynamic styles. As a result, we have six queries which the browser is performing at the same time (<a href="https://vexell.ru/files/testpool/#ex1">example 1</a>). (In all the examples, I have set a two seconds delay).

{% highlight javascript %}

function sendAjax(url, data) {
	return new Promise(function(resolve, reject) {
    	var req = new XMLHttpRequest();
    	req.open('POST', url);

    	req.onload = function() {
        	if (req.readyState != 4) return;
        	if (req.status == 200) {
            	resolve(req.response);
        	} else {
            	reject(Error(req.statusText));
        	}
    	};

    	req.onerror = function() {
        	reject(Error("Network Error"));
    	};

    	req.send(data);
	});
}

function logIt(startDate, requestId, $appendContainer) {
	var endDate = new Date();
	var text = 'Request #' + requestId + '. Execution time: ' + ((endDate - startDate) / 1000) + 's';
	var $li = document.createElement('li');
	$li.textContent = text;

	$appendContainer.appendChild($li);
}

document.querySelector('.js-ajax-requests').addEventListener('click', function(e) {
	e.preventDefault();
	var $appendContainer = e.currentTarget.nextElementSibling;

	for (var i = 1; i <= 8; i++) {
    	(function(i) {
        	var startDate = new Date();
        	sendAjax(REQUEST_URL + '?t=' + Math.random()).then(function() {
            	logIt(startDate, i, $appendContainer);
        	});
    	})(i);
	}
});

{% endhighlight %}

But what will happen if we start sending statistics? This is the result we get (<a href="https://vexell.ru/files/testpool/#ex2">example 2</a>):

<img class="no-box-shadow" src="{{page.imgdir}}/2.png">

As you can see, two send statistics requests have influenced the overall load on the site, and, if this data is necessary for the page to be displayed, the user will experience a delay equal to the time it takes to perform the fastest of the queries above.

In most cases, there is no point in waiting for an answer from the statistics, but these queries still influence the overall completion flow. How can this situation be avoided?

## Sending data

If you already use HTTP/2 or send data via a WebSocket connection, then this problem should not affect you at all. If, however, you are not yet using either of these, then you might find it helpful to simply move to HTTP/2 (and you will forget it all like a bad dream). Fortunately, all modern browsers support it, and the most popular web-servers already provide support for this protocol. The only problem you might encounter is the need to remove all your hacks for HTTP/1.1, such as domain sharding (which creates a surplus TCP connection and hinders prioritisation), JS and CSS concatenation and integrated dataURI images. Apart from this, when moving to HTTP/2, you will have to convert the whole site to HTTPS, which might be time-consuming, especially if you load a lot of the data from other resources using HTTP.

When using a WebSocket connection, you also obtain a permanent connection to the server and no limitations on the number of queries. There is nothing bad about this solution, apart from the fact that you have to get your socket server up-and-running and connect it with your system, which means extra work for developers. But, as a result, via the socket you will be able to transfer not only statistics but also ordinary queries. And the main thing is that it will allow you to receive notifications from the server and save on traffic.

### Method 1

If you are still not prepared to move to HTTP/2 or to use a WebSocket connection, the simplest solution is to move queries with statistics to a separate server. Then, you will be rid of your problem (<a href="https://vexell.ru/files/testpool/#ex3">example 3</a>):

<img class="no-box-shadow" src="{{page.imgdir}}/3.png">

In this case, do not forget about the CORS configuration, otherwise these queries will be blocked by the browser.

### Method 2

Using the possibilities provided by <a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API">Fetch API</a>, we can perform six more queries without sending cookies (<a href="https://vexell.ru/files/testpool/#ex4">example 4</a>,). But this will only help if the cookies are not used for authorisation in your requests. By default, Fetch does not send them. This looks like an implementation bug, but both Chrome and Firefox display the same behaviour. Is it a bug or is it a feature? To get rid of cookies, you need to set an additional parameter:

{% highlight javascript %}

fetch(REQUEST_URL + '?t=' + Math.random(), {
	method: 'POST',
	credentials: 'include'
}).then(function () {
	// ...
});

{% endhighlight %}

So, we have determined how we are going to send data to the server. But we are not going to send a query for every action by the user. Of course, it is better to buffer events and then to group-send them to the server. But in this case, if the user leaves the page, you risk losing the accumulated buffer. How can this situation be avoided?

## Buffering

Message buffering can be arranged with the help of the <a href="https://gist.github.com/ethyde/d56b12d8dbe2d7a327f2628b6fdd2f9f">debounce</a> function, which will also allow us to arrange for a delay between messages being sent. You can see a small example of this work <a href="https://codepen.io/vexellz/pen/apPyge">here</a> (if necessary, you can supplement it to take into account the volume of data being transferred or the maximum queue life).

Apart from using the **debounce** delay, there are <a href="https://developers.google.com/web/updates/2015/08/using-requestidlecallback">examples</a> of using the <a href="https://developer.mozilla.org/ru/docs/Web/API/Window/requestIdleCallback">window.requestIdleCallback</a> method, but, unfortunately, this is not supported by all modern browsers. The **requestIdleCallback** method queues a function which will be performed when the browser is idle. This option is good to use for performing background tasks, for example, sending statistics or lazy-loading some elements on the page. In view, it is better suited to aggregating synchronous calls. See the <a href="https://codepen.io/vexellz/pen/xqzrEd">example</a>.

Moreover, it is good to determine when your system will be ready for use and then to invoke the **ready()** method, after which the statistics will start being sent to the server, without blocking the rest of the work. Before that, it can go into the buffer.

## Guaranteeing events are delivered

Unfortunately, when using buffering, the following situation may arise: the user closes the tab and the statistics which you have collected are not sent and are lost. This can be avoided. The first thing that comes to mind is to create a **force()** method with the recipient of the statistics you are sending, to be executed in the case of <a href="https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload">beforeunload</a>. But, if you are using XHR queries for sending statistics, when the tab or browser is closed, the query won’t be executed either:

{% highlight javascript %}

window.addEventListener('beforeunload', sendData, false);
function sendData() {
  var client = new XMLHttpRequest();
  client.open("POST", "/server.php", false);
  client.send(data);
}

{% endhighlight %}

This can be remedied by sending a synchronised query, as in the example above. However this will block the user from performing actions with the browser. An alternative is to use the special method <a href="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon">sendBeacon</a>, which allows you to send small volumes of data to the server asynchronously and guarantees their delivery even after the page is closed. This method works on all modern browsers, apart from Safari and Internet Explorer (there is support in Edge). For  this two, you will have to retain the old synchronous XHR. But the main thing is that the method looks quite compact and simple:

{% highlight javascript %}

window.addEventListener('beforeunload', sendData, false);
function sendData() {
  var navigator = window.navigator;
  var url = "/server.php";

  if (!navigator.sendBeacon || !navigator.sendBeacon(url, data)) {
  	var t = new XMLHttpRequest();
  	t.open('POST', url, false);
  	t.setRequestHeader('Content-Type', 'text/plain');
  	t.send(data);
  }
}

{% endhighlight %}

To make sure that your queries are sent, all you need to do is open the ‘Network’ tab in Chrome DevTools and,  set a filter for ‘Other’ queries. This is where you will find all your sendBeacon queries.

Unfortunately, sendBeacon has its drawbacks, which mean that you cannot move all send queries over to it.
Firstly, the method will be subject to a limitation on the number of connections to a single domain (<a href="https://vexell.ru/files/testpool/#ex5">example 5</a>). This means that theoretically a situation could arise in which a query to send statistics blocks an important request for receiving data. There is an exception: if, instead of XHR queries, you use the new Fetch API not sending cookies, then sendBeacon won’t be subject to the limitation on connections (<a href="https://vexell.ru/files/testpool/#ex5">example 9</a>).

Secondly, sendBeacon may be subject to limitation on the size of query. For example, for Firefox and Edge the maximum query size used to be 64 Kb, but Firefox doesn’t have a limitation on data size anymore (<a href="https://vexell.ru/files/testpool/#ex8">example 8</a>). When I tried to find out the maximum data size for Chrome (at the present time the current version is 57), I discovered a very <a href="https://bugs.chromium.org/p/chromium/issues/detail?id=701678">interesting bug</a>, which makes the use of sendBeacon problematic and which caused our send statistics query to fail. Try to perform <a href="https://vexell.ru/files/testpool/#ex7">example 7</a>, reload the page and see the result of <a href="https://vexell.ru/files/testpool/#ex8">example 8</a>:

<img class="no-box-shadow" src="{{page.imgdir}}/4.png">

In Chrome, you still can’t send any other queries until the buffer reaches 64 Kb. This bug has now been fixed, and I hope that the bug fix will make its way into the next version. Now the limitation for one query will also be 64 Kb of data.

So, if you are using this method, and you send a lot of statistics from various components, then you will probably come up against the limit. If you exceed the limit, then the **navigator.sendBeacon()** method will return a **false** message. In that case it is better to use an ordinary XHR query, and to leave **navigator.sendBeacon()** for those instances when the user leaves the page. Also this method does not guarantee that the server will receive data if the internet connection is lost. So, when sending data, it is better to use the <a href="https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/onLine">navigator.onLine</a> property, which restores the browser’s network status before sending queries.

In principle, the <a href="http://codepen.io/vexellz/pen/OpbxqK">last solution</a> seems to be adequate in most cases. If we move sending statistics to a separate domain (<a href="https://vexell.ru/files/testpool/#ex6">example 6</a>), then the solution is practically universal, especially if we are considering desktop web applications. If we are considering mobile web, where connection loss is not a rare occurrence, and cases when it is essential to guarantee that messages are delivered to the server, then this solution is no longer suitable. In these situations it is better to use an ordinary XHR query and to check whether it has been carried out.

Is there a universal solution for both desktop and mobile web? If we take a look into the future and consider new experimental technologies, then this option does in fact exist.

## Service Worker and background synchronisation

Background synchronisation in <a href="https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API">Service Worker</a> is provided by <a href="https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/sync">Background Sync API</a> or in conjunction with another feature such as <a href="https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/periodicSync">periodic synchronisation</a>. Let’s take the example we have already considered, and let’s try to re-write it with the help of the possibilities provided by Service Worker.

You can view a completed test example <a href="https://vexell.ru/files/testpool/example-sw.html">following this link</a>. And here is the <a href="https://github.com/VeXell/test-sync">source code</a>.

{% highlight javascript %}

Statistic.prototype.\_sendMessageToServiceWorker = function(message) {
	return new Promise(function(resolve, reject) {
    	var messageChannel = new MessageChannel();
    	messageChannel.port1.onmessage = function(event) {
        	if (event.data.error) {
            	reject(event.data.error);
        	} else {
            	resolve(event.data);
      	  }
    	};

     navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
	});
};

Statistic.prototype.\_syncData = function() {
	return navigator.serviceWorker.ready.then(function(registration) {
    	return registration.sync.register('oneTimeStatisticSync');
	});
};

{% endhighlight %}

Service Worker:

{% highlight javascript %}

self.addEventListener('sync', function(event) {
	console.info('Sync event executed');

	if (event.tag == "oneTimeStatisticSync") {
    	event.waitUntil(sendStatistic());
	}
});

{% endhighlight %}

As you can see, this time we are sending the data directly to the Service Worker, interacting with it via PostMessage, and we are making the delay only for synchronisation. The major advantage of Service Worker is that, if an internet connection is suddenly lost, data is automatically only sent once the connection is regained. See the video below. Or try to do it yourselves. Simply disconnect the internet and click on the links in the example above. You will see that queries are only sent after the connection is regained.

<iframe src="https://player.vimeo.com/video/210548538" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

If you don’t want to get tangled up with manual synchronisation, and in order to simplify the code somewhat, you can use period synchronisation, which is accessible in Service Worker. Unfortunately, this doesn’t even work in Chrome Canary yet, and one can only conjecture how it might function. But someone has even already written a <a href="https://github.com/adaliszk/sw-periodic-sync">polyfill</a> for this:

{% highlight javascript %}

navigator.serviceWorker.register('service-worker.js')
	.then(function() {
    	return navigator.serviceWorker.ready;
	})
	.then(function(registration) {
    	this.ready();
    	return registration;
	}.bind(this))
	.then(function(registration) {
    	if (registration.periodicSync) {
        	registration.periodicSync.register({
           	tag: 'periodicStatisticSync',
           	minPeriod: 1000 * 30, // 30sec
           	powerState: 'auto',
           	networkState: 'online'
        	});
    	}
	});

{% endhighlight %}

You can use periodic synchronisation not only to send statistics, but also to load new data when the application is not active. It is very convenient, for example in the case news sites, to load new data every hour. However, since at the present time this option does not yet exist, you will have to use ordinary synchronisation and your own timers.
Probably one of the drawbacks of using Service Worker is that this method is not yet supported by all browsers. Also, its realisation requires the exclusive use of HTTPS protocol: Service Worker has to be connected by HTTPS and all fetch queries within it also need to use this protocol (**localhost** is an exception).

## Conclusion

In conclusion, I would like to point out that more and more options for monitoring and sending data from web applications are now available. The web is developing quite well in this direction. So, the use of the existing possibilities which browsers provide allows statistics to be collected from web resources in quite a useful way. a quality manner.

And always remember: the statistics you collect (if you collect and analyse them properly) will help you to understand how your site works, and how exactly the users interact with it”

I wish you success collecting your statistics!

**Vyacheslav Volkov, Frontend Developer.**
