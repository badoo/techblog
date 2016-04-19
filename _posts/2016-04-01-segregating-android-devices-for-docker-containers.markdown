---
layout: post
title:  Segregating Android Phones between Docker Containers
author: Tim Baverstock
date:   2016-04-01
categories: android
---

We wanted to move our Android device tests to a Linux host, mainly because we find that our Mac Mini build machines tend to fumble Android USB connections, making phones mysteriously vanish in the middle of a test run.
We mostly use Docker containers to manage our Linux servers, and we decided to try to build an Android test container that could test with real phones, cloned once for each model/group of phones, so it would fit into the existing server scheme.

### Docker

Docker is a system that  combines a means to package software, together with a system-level framework that keeps each package of software isolated from the rest of the computer: separate filing system, separate process space, etc. It’s a light-weight alternative to full-blown virtual machines: processes share the same operating system instance, and the operating system is a lot more strict about who can talk to what than usual, so the overall effect is the same.

Clarifying diagrams from Docker's website:

A VM system runs other OSs on top of the host OS:
![VM]({{page.imgdir}}/what-is-docker-diagram.png)

A Docker system runs containers on top of one OS:
![Docker]({{page.imgdir}}/what-is-vm-diagram.png)

### Segregating adb/adbd

We want each container to control its own set of phones. The most natural way of doing this is to assign each group of USB sockets to a different container - devices plugged into the computer’s front panel appear in the directory /dev/bus/usb/001, so we allow container 1 to see that directory; devices plugged into the back panel appear in /dev/bus/usb/002, so container 2 is allowed to see that directory, and the three sockets on the expansion card appear at usb/003, 004, and 005 are allocated to containers 3, 4, and 5 respectively.

So far, so good, but  Android's ADB command talks to the phones through a daemon on the default port 5037 which is machine-wide, so the first container to run adb would start the daemon and cause all the other containers to connect to that daemon and see the first container’s phones. This is fairly easy to solve with docker networking, but it suited us to use a different mechanism: each container was configured with a different value of the environment variable ANDROID_ADB_SERVER_PORT. We allocated a port to each container (based on the USB bus number) so each container starts its own adb daemon, which can only see that container’s own phones.

We found that we needed to be careful not to run ‘adb’ without setting ANDROID_ADB_SERVER_PORT, because only one daemon can access a phone at a time, so there’s a risk of losing phones if that’s accidentally started, but we can run ‘unset ANDROID_ADB_SERVER_PORT; adb kill-server’ in a subshell in the build script to kill it safely.

If we were only using emulators, this would suffice. However, we use real devices, so...

### Updating containers with hot-plugged USB devices

The second problem - and the main reason for writing this article - was that when a phone was rebooted as part of our normal build process, it vanished from the container's file system and didn't come back!

There's an amusingly simple workaround to resolve this, but it's counterintuitive if you're used to thinking about containers as wholly isolated from the host system: just create and remove the USB nodes in the container as they appear and disappear in the host machine's /dev/bus/usb hierarchy.

We could have left something like this running on the host:

{% highlight sh %}
while sleep 2; do
  for i in containerA:001 containerB:002 containerC:003 ; do
    docker exec %{i#*:} rm -rf /tmp/usb
    docker cp /dev/bus/usb/${i%:*} %{i#*:}:/tmp/usb
    docker exec %{i#*:} rsync --delete -d --ignore-existing /tmp/usb/ /dev/bus/usb/${i%:*}/
  done
done 
{% endhighlight %}

We actually ended up plumbing something like this into udev:

{% highlight sh %}
# /etc/udev/rules.d/80-hotplug.rules
SUBSYSTEM=="usb", ACTION=="add", RUN=="/local/usb_hot_device.sh %N mknod -m 664 %N %M %m"
SUBSYSTEM=="usb", ACTION=="remove", RUN=="/local/usb_hot_device.sh %N rm %N"
{% endhighlight %}

{% highlight sh %}
#!/bin/bash
# /local/usb_hot_device.sh
NODE=$1 ; shift
CONTAINER[001]=perplexity
CONTAINER[002]=resignation
CONTAINER[003]=confrontation
CONTAINER[004]=cooperation
CONTAINER[004]=schadenfreude
BUS=$(/usr/bin/basename $(/usr/bin/dirname $NODE))
docker exec ${CONTAINER[$BUS]} "$@"
{% endhighlight %}

### Getting fancy

The above is a simple mapping of USB bus to container, which is fine so long as you have enough USB buses (we added a PCIe USB card for three extras) but it would be fairly simple to arrange to recognise a particular model of phone by its USB manufacturer number, and mknod or rm the appropriate device-node in the given container's /dev/bus/usb directory, so there'd be no need to segregate the phones at the hardware level.

That's probably most easily done from within udev, where the USB parameters are readily available.

