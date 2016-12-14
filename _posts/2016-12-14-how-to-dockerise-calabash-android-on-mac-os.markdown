---
layout: post
title:  How to Dockerise Calabash-Android on Mac OS
author: Rajdeep Varma
date:   2016-12-14
categories: QA Android Automation
excerpt: One of our goal is to make it super easy for developers to run these tests in one command without going through the pain of setting up  a test-scripting environment (Installing JDK, Android SDK, Ruby, and praying that nothing else has been added since the documentation was written).
---
<img class="no-box-shadow" src="{{page.imgdir}}/2.jpeg"/>

At Badoo, we use Calabash for automated Android application testing. One of our goal is to make it super easy for developers to run these tests in one command without going through the pain of setting up  a test-scripting environment (Installing JDK, Android SDK, Ruby, and praying that nothing else has been added since the documentation was written).
The two obvious choices were Vagrant and Docker. Speed of execution was one of the main criteria for us, so we ended up choosing <a href="https://www.docker.com/" target="_blank">Docker</a>.

Most of the people in our team use Mac laptops and setting up Docker with Calabash-Android on Mac is not straightforward. In this article I will share with you the problems we had and the solutions we implemented.

## Problem 1

Docker for Mac is built on top of xhyve, one of the derivatives of the OS X **Hypervisor.Framework**, but it does not support USB. This is immediately a problem, because the **Android Debug Bridge (ADB)** needs the USB system to detect and communicate with phones.

### Workaround

Running **ADB** starts a server which manages the Android devices, but that server normally runs on the same machine. Instead, we start the **ADB** server on the Mac (which can see the USB system), and let the ADB client inside the Docker container talk to it through a proxy.

While there are many ways to run the  **ADB** server on the Mac host and connect to it from inside the container, I found this existing Java utility does it in a simple way: <a href="https://bitbucket.org/chabernac/adbportforward" target="-blank">https://bitbucket.org/chabernac/adbportforward</a>


There are no downsides to this approach, since Android developers will have ADB installed on their Macs already.

## Problem 2

In Calabash-Android, Ruby code calls a tiny http server running inside the device to drive the app. To call an http server running inside the device, Calabash uses **ADB** port forwarding: **ADB** forward **tcp:xxxx tcp:yyyy**

This routes all calls made at **http://localhost:xxxx** of the Mac to the http server running on port **‘yyyy’** inside the Android device.

The problem is, calls to **http://localhost:xxxx** will not work from inside the container because the localhost of the container is not the localhost of the Mac. Therefore, we would need to make calls to **http://osx_host_ip:xxxx/** from inside the container.

But this does not work for two reasons:

1. **Limitation of ADB**: when port forwarding, ADB only binds to the localhost interface (127.0.0.1) and not all interfaces. This means **http://osx_host_ip:xxxx/** will not work.
2. Networking limitations of <a href="https://docs.docker.com/docker-for-mac/networking/#known-limitations-use-cases-and-workarounds" target="_blank">Docker for Mac</a>. This means there is no easy way to access the localhost of the Mac host from the container.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

### Workaround

We can forward any traffic for a network interface to the localhost interface. This means any calls to **http://osx_host_ip:xxxx/** will be redirected to **http://localhost:xxxx/**

We use this script snippet:

{% highlight shell %}

CALABASH_SERVER_PORT=34778
echo "
    rdr pass on lo0 inet proto tcp from any to self port $CALABASH_SERVER_PORT -> 127.0.0.1 port $CALABASH_SERVER_PORT
    rdr pass on en0 inet proto tcp from any to any port $CALABASH_SERVER_PORT -> 127.0.0.1 port $CALABASH_SERVER_PORT
    rdr pass on en1 inet proto tcp from any to any port $CALABASH_SERVER_PORT -> 127.0.0.1 port $CALABASH_SERVER_PORT
    " | sudo pfctl -ef -

{% endhighlight %}
<br>

### The solution

1. Create a shell script called ‘started.sh’::

{% highlight shell %}

#!/usr/bin/env bash
pkill -f adbportforward.jar

#start adb server on mac host
java -jar path/to/adbportforward.jar server adblocation=$(dirname `which adb`) </dev/zero  >adbforward.log &


CALABASH_SERVER_PORT=34778
WORK_DIR=`pwd`


# forward calls from all network interfaces to localhost of mac
echo "
    rdr pass on lo0 inet proto tcp from any to self port $CALABASH_SERVER_PORT -> 127.0.0.1 port $CALABASH_SERVER_PORT
    rdr pass on en0 inet proto tcp from any to any port $CALABASH_SERVER_PORT -> 127.0.0.1 port $CALABASH_SERVER_PORT
    rdr pass on en1 inet proto tcp from any to any port $CALABASH_SERVER_PORT -> 127.0.0.1 port $CALABASH_SERVER_PORT
    " | sudo pfctl -ef -


DOCKER_HOST=`ifconfig | awk '/inet / && !/127.0/ {print $2; exit}'`


docker run -it \
    -v /Users:/Users \
    -e DOCKER_HOST=$DOCKER_HOST \
    -e CALABASH_SERVER_PORT=$CALABASH_SERVER_PORT \
    --entrypoint=$WORK_DIR/path/to/entrypoint.sh \
    -w=$WORK_DIR \
    rajdeepv/android_ruby "$@"


pkill -f adbportforward.jar

{% endhighlight %}

2) This is how entrypoint.sh looks:

{% highlight shell %}

#!/usr/bin/env bash
set -e


# connect adb-client to adb-server running in host mac os
nohup java -jar path/to/adbportforward.jar client adblocation=/opt/android-sdk-linux/platform-tools remotehost=$DOCKER_HOST >/dev/null 2>&1 &


#wait for connection to establish
sleep 2


adb devices


bundle install --path ./.bundle --retry 3


APK=$1
shift 1


# Run Tests
bundle exec calabash-android run $APK  \
    TEST_SERVER_PORT=$CALABASH_SERVER_PORT \
    DEVICE_ENDPOINT='http://$DOCKER_HOST:$CALABASH_SERVER_PORT'  "$@"

{% endhighlight %}

3) This is how a test runs:

{% highlight html %}

./started.sh path/to/your.apk features/my_feature/awesome.feature

{% endhighlight %}

## Conclusion

While the exercise was to deliver the automated tests as a fully self-contained solution I compromised with a small dependency of having **‘ADB’** installed locally, but as mentioned, all Android developers have **ADB** locally.
In the end, the results were great and our developers started using tests to reproduce bugs and to create complex test data. This certainly enhanced the importance of automation at Badoo.


That’s pretty much it! If you have any questions or suggestions, feel free to drop them below.

**Rajdeep Varma - Automation QA Engineer**
