---
layout: post
title:  Segregating Android Phones between Docker Containers
author: Tim Baverstock
date:   2016-04-01
categories: android
---

We wanted to move our Android device tests to a Linux host: it's cheaper hardware, and we find that our Mac Mini build machines tend to fumble Android USB connections, making phones mysteriously vanish in the middle of a test run.
We mostly use Docker containers to manage our Linux servers, and we decided to try to build an Android test container that could test with real phones, cloned once for each model/group of phones, so it would fit into the existing server scheme.

A quick sidebar: one of the benefits of running on Linux over running on Mac was that because it's a more open system, it showed us one of the causes of the phones' mysterious disappearance during the tests: disconnections lasting a fraction of a second. This allowed us to patch our test layer, adding a retry in the right place which has resolved pretty much all of our remaining problems in that regard. I will be encouraging my colleague to write that up shortly.

### Docker

Docker is a system that combines a means of building and distributing software configurations together with an operating-system framework that keeps each 'container' of software isolated from the rest of the computer: separate filing system, separate process space, etc. Container processes share the same operating system instance, but the operating system is a lot more strict about who can talk to what than usual, so the overall effect is similar to a set of virtual machines.

Clarifying diagrams from Docker's website:

A VM system runs other OSs on top of the host OS:
![VM]({{page.imgdir}}/what-is-docker-diagram.png)

A Docker system runs containers on top of one OS:
![Docker]({{page.imgdir}}/what-is-vm-diagram.png)

### Segregating adb/adbd

We wanted each container to control its own set of phones. The most natural way of doing this was to assign each group of USB sockets to a different container - devices plugged into the computer’s front panel appear in the directory /dev/bus/usb/001, so we allow container 1 to see that directory; devices plugged into the back panel appear in /dev/bus/usb/002, so container 2 is allowed to see that directory, and we ordered an expansion card for more connections.

So far, so good, but Android's ADB command talks to the phones through a daemon on the default port 5037 which is machine-wide, so the first container to run adb would start the adb daemon (adbd) and cause all the other containers to connect to that daemon and see the first container's phones. This could have been solved with docker networking (each docker container gets its own IP, and hence its own set of ports), but it suited us to use a different mechanism: each container was configured with a different value of the environment variable ANDROID_ADB_SERVER_PORT. We allocated a port to each container so each container starts its own adb daemon, which can only see that container’s own phones.

While developing this, we found that we needed to be careful not to run ‘adb’ at the host-machine level without setting ANDROID_ADB_SERVER_PORT, because a host-level adbd that could see all the USB ports would 'steal' phones from the Docker containers: phones can only talk to one 'adbd' at a time.

If we were only using emulators, separate adbd processes would suffice. However, we use real devices, so...

### Updating containers with hot-plugged USB devices

The second problem - and the main reason for writing this article - was that when a phone was rebooted as part of our normal build process, it vanished from the container's file system, and hence its list of phones, and never came back!

On the host machine, you can see phones being added and removed by keeping a look at the files in /dev/bus/usb: the system creates and deletes files to match the phones:

{% highlight sh %}
  while sleep 3; do
    find /dev/bus/usb > /tmp/a
    diff /tmp/a /tmp/b
    mv /tmp/a /tmp/b
  done
{% endhighlight %}

Unfortunately, not only do these creations and deletions not happen within the Docker containers, but even if you set things up to create and delete those nodes, the nodes you create don't actually talk to the phones!

The sledge-hammer we used to resolve this issue was putting our containers in --privileged mode, and letting them see the whole /dev/bus/usb directory as the host machine sees it.

Now we needed a different mechanism to segregate the phones by bus. I downloaded the Android source, and trivially patched platform/system/core/adb/usb_linux.cpp

{% highlight cpp %}
        std::string bus_name = base + "/" + de->d_name;

+        const char* filter = getenv("ADB_DEV_BUS_USB");
+        if (filter && *filter && strcmp(filter, bus_name.c_str())) continue;

        std::unique_ptr<DIR, int(*)(DIR*)> dev_dir(opendir(bus_name.c_str()), closedir);
        if (!dev_dir) continue;
{% endhighlight %}

Each container was given a different ADB_DEV_BUS_USB value to denote the bus it should pay attention to.

Aside: although the patch was trivial, building abd required trial and error, because most people want to build everything. My final recipe was this (in a case-sensitive filesystem - my work laptop is a mac):

{% highlight sh %}
cd src/android-src
source build/envsetup.sh
lunch 6
vi system/core/adb/usb_linux.cpp
JAVA_NOT_REQUIRED=true make adb
out/host/linux-x86/bin/adb
{% endhighlight %}

### Multiplexing USB ports

So far so good, but when we installed our USB expansion card, we found there was only one USB bus on it, whereas we had five groups of devices we wanted to segregate.

Having been inside ADB's source code already, I decided simply to add another environment variable: ADB_VID_PID_FILTER takes a list of vid:pid pairs, and makes adb ignore any device that doesn't match.

The patch is below. There may be a slight race condition, when multiple adbd processes listening to the same USB bus try to scan the phones, but this hasn't proven to be a problem in practice.

{% highlight cpp %}
diff --git a/adb/usb_linux.cpp b/adb/usb_linux.cpp
index 500898a..92e15ca 100644
--- a/adb/usb_linux.cpp
+++ b/adb/usb_linux.cpp
@@ -115,6 +115,71 @@ static inline bool contains_non_digit(const char* name) {
     return false;
 }

+static int iterate_numbers(const char* list, int* rejects) {
+  const char* p = list;
+  char* end;
+  int count = 0;
+  while(true) {
+    long value = strtol(p, &end, 16);
+//printf("%d, %p ... %p (%c) = %ld (...%s)\n", count, p, end, *end, value, p);
+    if (p == end) return count;
+    p = end + 1;
+    count++;
+    if (rejects) rejects[count] = value;
+    if (!*end || !*p) return count;
+  }
+}
+
+int* compute_reject_filter() {
+    char* filter = getenv("ADB_VID_PID_FILTER");
+    if (!filter || !*filter) {
+        filter = getenv("HOME");
+        if (filter) {
+            const char* suffix = "/.android/vidpid.filter";
+            filter = (char*) malloc(strlen(filter) + strlen(suffix) + 1);
+            *filter = 0;
+            strcat(filter, getenv("HOME"));
+            strcat(filter, suffix);
+        }
+    }
+    if (!filter || !*filter) {
+        return (int*) calloc(sizeof(int), 1);
+    }
+    if (*filter == '.' || *filter == '/') {
+        FILE *f = fopen(filter, "r");
+        if (!f) {
+            if (getenv("ADB_VID_PID_FILTER")) {
+                // Only report failure for non-default value
+                printf("Unable to open file '%s'\n", filter);
+            }
+            return (int*) calloc(sizeof(int), 1);
+        }
+        fseek(f, 0, SEEK_END);
+        long fsize = ftell(f);
+        fseek(f, 0, SEEK_SET);  //same as rewind(f);
+        filter = (char*) malloc(fsize + 1);  // Yes, it's a leak.
+        fsize = fread(filter, 1, fsize, f);
+        fclose(f);
+        filter[fsize] = 0;
+    }
+    int count = iterate_numbers(filter, 0);
+    if (count % 2) printf("WARNING: ADB_VID_PID_FILTER contained %d items\n", count);
+    int* rejects = (int*)malloc((count + 1) * sizeof(int));
+    *rejects = count;
+    iterate_numbers(filter, rejects);
+    return rejects;
+}
+
+static int* rejects = 0;
+static bool reject_this_device(int vid, int pid) {
+    if (!*rejects) return false;
+    for ( int len = *rejects; len > 0; len -= 2 ) {
+//printf("%4x:%4x vs %4x:%4x\n", vid, pid, rejects[len - 1], rejects[len]);
+        if ( vid == rejects[len - 1] && pid == rejects[len] ) return false;
+    }
+    return true;
+}
+
 static void find_usb_device(const std::string& base,
         void (*register_device_callback)
                 (const char*, const char*, unsigned char, unsigned char, int, int, unsigned))
@@ -127,6 +192,8 @@ static void find_usb_device(const std::string& base,
         if (contains_non_digit(de->d_name)) continue;

         std::string bus_name = base + "/" + de->d_name;
+        const char* filter = getenv("ADB_DEV_BUS_USB");
+        if (filter && *filter && strcmp(filter, bus_name.c_str())) continue;

         std::unique_ptr<DIR, int(*)(DIR*)> dev_dir(opendir(bus_name.c_str()), closedir);
         if (!dev_dir) continue;
@@ -176,6 +243,12 @@ static void find_usb_device(const std::string& base,
             pid = device->idProduct;
             DBGX("[ %s is V:%04x P:%04x ]\n", dev_name.c_str(), vid, pid);

+            if(reject_this_device(vid, pid)) {
+                D("usb_config_vid_pid_reject");
+                unix_close(fd);
+                continue;
+            }
+
                 // should have config descriptor next
             config = (struct usb_config_descriptor *)bufptr;
             bufptr += USB_DT_CONFIG_SIZE;
@@ -574,6 +647,7 @@ static void register_device(const char* dev_name, const char* dev_path,
 static void device_poll_thread(void*) {
     adb_thread_setname("device poll");
     D("Created device thread");
+    rejects = compute_reject_filter();
     while (true) {
         // TODO: Use inotify.
         find_usb_device("/dev/bus/usb", register_device);
{% endhighlight %}

I hope all this saves you some time, if you're engaged in a similar project. Feel free to ask for clarifications in the comments below.

