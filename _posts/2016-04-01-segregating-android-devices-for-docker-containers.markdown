---
layout: post
title:  Segregating Android Phones between Docker Containers
author: Tim Baverstock
date:   2016-04-01
categories: android
---

We wanted to move our Android device tests to a Linux host, mainly because we find that our Mac Mini build machines tend to fumble Android USB connections, making phones mysteriously vanish in the middle of a test run.

We mostly use Docker containers to manage our Linux servers, so we decided to build an Android test container, cloned once for each model/group of phones.

### Segregating adb/adbd

It was easy enough to map one USB bus to each container: /dev/bus/usb/001, 002, etc., but the first problem we ran into was that Android's ADB command starts a daemon on the default port 5037 which is machine-wide, so the first container to run would 'win'. This is fairly easy to solve with docker networking, but it suited us to use a different mechanism: each container was configured with a different value of the environment variable ANDROID_ADB_SERVER_PORT - we calculated a port number by adding the USB bus number to 5037.

We found that we needed to be careful not to run 'adb' from outside all the containers, because only one adbd can 'see' a phone at the same time.

If we were only using emulators, this would suffice. However, we use real devices, so...

### Updating containers with hot-plugged USB devices

The second problem - and the main reason for writing this article - was that when a phone was rebooted as part of our normal build process, it vanished from the container's file system and didn't come back!

It's an amusingly simple workaround to resolve this, and one which lends itself to various levels of sophistication: create and remove the USB nodes in the container as they appear and disappear in the host machine's /dev/bus/usb hierarchy.

We could have left something as trivial as this running on the host:

{% highlight sh %}
while sleep 2; do
  for i in container:001 container:002 container:003 ; do
    docker exec %{i#*:} rm -rf /tmp/usb
    docker cp /dev/bus/usb/${i%:*} %{i#*:}:/tmp/usb
    docker exec %{i#*:} rsync --delete -d --ignore-existing /tmp/usb/ /dev/bus/usb/${i%:*}/
  done
done 
{% endhighlight %}

We actually ended up plumbing something similar into the udev system, updating only the container which had been allocated the new device's given USB bus.

### Getting fancy

The above is a simple mapping of USB bus to container, which is fine so long as you have enough USB buses (we added a PCIe USB card for three extras) but it would be fairly simple to arrange to recognise a particular model of phone by its USB manufacturer number, and mknod or rm the appropriate device-node in the given container's /dev/bus/usb directory, so there'd be no need to segregate the phones at the hardware level.

That's probably most easily done from within udev, where the USB parameters are readily available.

