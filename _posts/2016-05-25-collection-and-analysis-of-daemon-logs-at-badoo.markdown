---
layout: post
title:  Collection and Analysis of Daemon Logs at Badoo
author: Marko Kevac
date:   2016-06-6
categories: infrastructure logs
excerpt: At Badoo the monitoring division is responsible for keeping track of and sorting out problems with daemons. Our staff use Zabbix and scripts to check that the service has launched and is responding to requests. Additionally, the department examines statistics for daemons and the scripts that work with them, looking for anomalies, sudden spikes etc.
---

We have a few dozen homebrew daemons at Badoo. Most of them are written in C, one in C++ and five or six in Go. They run on about a hundred servers in four data centres.

At Badoo the monitoring division is responsible for keeping track of and sorting out problems with daemons. Our staff use Zabbix and scripts to check that the service has launched and is responding to requests. Additionally, the department examines statistics for daemons and the scripts that work with them, looking for anomalies, sudden spikes etc.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

Until recently, we have been missing an important part: collection and analysis of logs files written locally by each daemon. This information can help to either catch a problem at a very early stage, or to understand the reasons for a failure after the fact.

So we designed a system to handle this task and are excited to share the details with you.  I’m certain that some of you reading this will face a similar task, and we hope that this article will help you avoid some of the errors that we made.

## Choice of tools

From the outset we decided against using a cloud system because we have a policy about keeping data inside the company whenever possible. After analysing some popular tools, we concluded that the three following systems best suited our needs:

- <a href="http://www.splunk.com/" target="_blank">Splunk</a>
- <a href="https://www.elastic.co/" target="_blank">ELK</a>
- <a href="https://www.graylog.org/" target="_blank">Graylog 2</a>

### Splunk

We tried out Splunk first. Splunk is a turnkey system, a proprietary solution whose cost depends on how much traffic the system deals with. We already use this system in the billing department and our colleagues are very pleased with it.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

We piggy-backed on their installation, but soon realised that our traffic exceeds the limit we are paying for.

One thing we took into account was that some of our colleagues complained about the complexity and non-user-friendliness of the UI when testing. Though our billing colleagues were already versed in Splunk and had no problems with it, we still took the UI complaints seriously since we want our system to be used actively.

From the technical POV Splunk completely suited our needs. But its cost and awkward interface forced us to look further.

### ELK: Elastic Search + Logstash + Kibana

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

ELK was next on our list. ELK is probably the most popular system to date for collecting and analysing logs. And this is not really surprising since it is free, easy to use, flexible and powerful.

ELK consists of three components:

- Elastic Search: A data storage and retrieval system based on the Lucene engine
- Logstash: A "Pipe" with a bunch of features that send data (possibly processed) to Elastic Search
- Kibana: A web interface for searching and visualising data from Elastic Search

Getting started with ELK is very simple: you just have to download three archives from the official site, unzip them and run a few binaries. The system's simplicity allowed us to test it out over a few days and realise how well it suited us.

It really did fit like a glove. Technically we can implement everything we need, and, when necessary, write our own solutions and build them into the general infrastructure.

Despite the fact that we were completely satisfied with ELK, we wanted to give the third contender a fair shot.

### Graylog 2

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>

Overall, Graylog 2 is very similar to ELK: the code is open source, it's easy to install, and it also uses Elastic Search and gives you the option to use Logstash. The main difference is that Graylog 2 is ready to use "out of the box" and designed specifically to collect logs. Its end-user readiness is reminiscent of Splunk. It has an easy-to-use graphical interface with the ability to customise line parsing directly in your web browser, as well as access restrictions and notifications.

Nevertheless we concluded that ELK is a much more flexible system that we could customise to suit our needs and whose components could be changed out easily. You don’t want to pay for Watcher - it’s fine. Make your own. Whereas with ELK all the components can be easily removed and replaced, with Graylog 2 it felt like removing some parts involved ripping out the very roots of the system, and other components could just not be incorporated.

So we made our decision and stuck with ELK.

### Log delivery

At a very early stage we made it a requirement that logs have to both end up in our system and remain on the disk. Log collection and analysis systems are great, but any system experiences delays or malfunctions. In these cases, nothing surpasses the features that standard Unix utilities like grep, AWK, sort etc. offer. A programmer should always be able to log on to the server and see what is happening there with their own eyes.

There are a few different ways to deliver logs to Logstash:

- Use utilities available from the ELK set (Logstash-forwarder, or (as of recently) Beats). They are a separate daemons that monitor files on disk and pipe them into Logstash.
- Use our own utility called LSD, which we use to deliver PHP logs. This is also a separate daemon that monitors log files in the file system and pipes them in where they need to go. On one hand, all the problems that could occur in LSD were taken into account and addressed while sending huge quantities of logs from a vast number of servers, but, on the other hand, the system is too focused on PHP-scripts, which meant that we would have to modify it.
- Send logs to the syslog (which is the standard in the  Unix world) alongside recording to disk.

Despite the shortcomings of this last approach, it was so simple that we decided to try it.

## Architecture

### Server and rsyslogd

We sketched out a plan that seemed reasonable to us with the help of the system administrators. This involved putting one rsyslogddaemon on each server, one main rsyslogddaemon per platform, one Logstash per platform and one Elastic Search cluster closer to us, i.e. in the Prague data centre, which is closer to Moscow.

Each server looks like this:

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>

Because we use Docker in some places at Badoo, we planned to mount the /dev/log socket inside the container using built-in features.
This is how the final architecture looked :

<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>

This architecture seemed to work well at preventing data loss: in case of problems, each rsyslogd daemon will cache messages on disk and send them later.
The only data loss that could occur would be if the very first rsyslogddaemon didn't work. We knew the risks and decided that for logs, it is not worth spending our time on these small  niggles at this point at time.

### The format of the log line and Logstash

<img class="no-box-shadow" src="{{page.imgdir}}/7.gif"/>

Logstash is a pipeline where lines of text are sent. They are parsed internally and then go into Elastic Search in a form that allows fields and tags to be indexed.

Almost all our services are built using our own libangel library, which means that they all have the same log format that looks like this:

{% highlight html %}

Mar 04 04:00:14.609331 [NOTICE] <shard6> <16367> storage_file.c:1212
storage___update_dump_data(): starting dump (threaded, updating)

{% endhighlight %}

The format consists of a common part, which is the same everywhere, and parts that the programmer puts in when calling one of the logging functions.

The general section includes the date, time down to microseconds, log level, tag, PID, the file name and line number in the sources, and the name of the function, i.e. the most basic things.

Syslog then adds its own information: time, PID, the hostname server, and the so-called ident. Usually this is just a program name, but really anything can go there.

We standardised "ident" as the daemon's name, secondary name and version. For example, *meetmaker-ru.mlan-1.0.0.* Thus we can distinguish logs from various daemons, as well as from different types of single daemon (for example, a country or replica) and have information about the daemon version that's running.

Parsing this type of message is fairly straightforward. I won't show examples of config files in this article, but it basically works by biting off small chunks and parsing parts of strings using regular expressions.

If any stage of parsing fails, we add a special tag to the message, which allows you to search for such messages and monitor their number.

A note about time parsing: We tried to take different options into account, and final time will be the time from libangel by default (so basically the time when the message was generated). If for some reason this time can't be found, we take the time from syslog (i.e. the time when the message went to the first local syslog daemon). If, for some reason, this time is also not available, then the message time will be the time the message was received by Logstash.

The resulting fields go in Elastic Search for indexing.

<img class="no-box-shadow" src="{{page.imgdir}}/8.png"/>

### ElasticSearch

Elastic Search supports cluster mode where multiple nodes are combined into a single entity and work together. Due to the fact that each index can replicate to another node, the cluster remains operable even if some nodes fail.

The minimum number of nodes in the fail-proof cluster is three — three is the first odd number greater than one. This is due to the fact that the majority of clusters need to be available when splitting occurs in order for the internal algorithms to work. An even number of nodes will not work for this.

We have three dedicated servers for the Elastic Search cluster and configured it so that each index has a single replica, as shown in the diagram.

<img class="no-box-shadow" src="{{page.imgdir}}/9.png"/>

With this architecture if a given node fails, it's not a fatal error, and the cluster itself remains available.

Besides dealing well with malfunctions, this design also makes it easy to update Elastic Search: just stop one of the nodes, update it, launch it, rinse and repeat.

The fact that we store logs in Elastic Search makes it easy to use daily indexes. This has several benefits:

- If the servers run out of disk space, it's very easy to delete old data. This is a quick operation, and there is a tool called Curator that is designed for this task.
- During searches of time-spans of more than one day, the search can be conducted simultaneously. Furthermore, the search can be run simultaneously on multiple nodes.

As mentioned earlier, we set up <a href="https://github.com/elastic/curator" target="_blank">Curator</a> in order to automatically delete old indexes when space is running out.

The Elastic Search settings include a lot of details associated with both Java and Lucene. But the official documentation and numerous articles go into a lot of depth about them, so I won't repeat that information here. I'll only briefly mention that the Elastic Search will use both the Java Heap and system Heap (for Lucene). Also, do not forget to set "mappings" that are tailored for your index fields to accelerate work and reduce disk space consumption.

### Kibana
There isn't much to say here :-) We just set it up and it works. Fortunately, the developers made it possible to change the timezone settings in the latest version. Earlier, the local time zone of the user was used by default, which is very inconvenient because our servers everywhere are always set to UTC, and we are used to communicating by that standard.

### Notification system

A notification system was one of our main requirements for a log collection system. We wanted a system  that, based on rules or filters, would send out triggered alerts with a link to the page where you can see details.

In the world of ELK there were two similar finished product:

- <a href="https://www.elastic.co/products/watcher" target="_blank">Watcher</a> from the company Elastic
- <a href="https://github.com/Yelp/elastalert" target="_blank">Elastalert</a> from <a href="http://www.yelp.com/london" target="_blank">Yelp</a>

Watcher is a proprietary product of the Elastic company that requires an active subscription. Elastalert is an open-source product written in Python. We shelved Watcher almost immediately for the same reasons that we had for earlier products  because it's not opensource and is difficult to expand and adapt to our needs. During testing, Elastalert proved very promising, despite a few minuses (but these weren't very critical):

- It is written in Python. We like Python as a language for quickly writing "supporting" scripts, but don't like to see it used in production as an end product.
- It only lets you put together very rudimentary emails for the system to send out in response to events. For us, the look and convenience of emails is important, since we want others to use the system.

After playing around with Elastalert and examining its source code, we decided to write a PHP product with the help of our Platform Division. As a result, Denis Karasik <a href="https://habrahabr.ru/users/battlecat/" target="_blank">Battlecat</a> wrote a product designed to meet our requirements: it is integrated into our back office and only has the functionality we need.

<img class="no-box-shadow" src="{{page.imgdir}}/10.png"/>

<img class="no-box-shadow" src="{{page.imgdir}}/11.png"/>

For each rule, the system automatically generates the basic dashboard in Kibana and a link to it is included in the email. When you click on the link you will see the message and the graph for the time period stated in the notification.

<img class="no-box-shadow" src="{{page.imgdir}}/12.png"/>

<img class="no-box-shadow" src="{{page.imgdir}}/13.png"/>

## Issues

At this stage, the first system release was ready for use. But issues cropped up more-or-less immediately.

### Problem 1 (syslog + Docker)

The syslog daemon and the program usually communicate via the /dev/log Unix socket. As mentioned earlier, we put it into the container using <a href="https://docs.docker.com/engine/userguide/containers/dockervolumes/#mount-a-host-file-as-a-data-volume" target="_blank">standard features</a> of Docker. This solution worked fine until we needed to reboot the syslog daemon.

Apparently, if you pass a particular file rather than a directory, when you delete or recreate a file on the host system, it will no longer be available inside the container. It turns out that any restart of the syslog daemon causes logs from Docker-containers to stop piping in.

If the entire directory is moved, however, then the Unix-socket canbe inside, and restarting the daemon will not break anything. But then the whole setup is complicated because libc expects the socket to be in /dev/log.

The second option that we considered was  to use UDP or TCP to send out logs. But then the same problem would occur: libc is only able to write in /dev/log. We would have had to write our own syslog client and at this point we didn't want to do that.

In the end we decided to launch a syslog daemon in each container and continue to write in /dev/log using the standard libc functions openlog()/syslog().

This wasn't a big problem, because our system administrators use init system in each container anyway.

### Problem 2 (blocking syslog)

In the devel-cluster, we noticed that one of the daemons was freezing intermittently. When we enabled the internal watchdog daemon, we got some backtrace that showed that the daemon was freezing in syslog()-> write ().

{% highlight html %}

==== WATCHDOG ====
tag: IPC_SNAPSHOT_SYNC_STATE
start: 3991952 sec 50629335 nsec
now: 3991953 sec 50661797 nsec
Backtrace:
/lib64/libc.so.6(__send+0x79)[0x7f3163516069]
/lib64/libc.so.6(__vsyslog_chk+0x3ba)[0x7f3163510b8a]
/lib64/libc.so.6(syslog+0x8f)[0x7f3163510d8f]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running(zlog1+0x225)[0x519bc5]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running[0x47bf7f]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running(storage_save_sync_done+0x68)[0x47dce8]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running(ipc_game_loop+0x7f9)[0x4ee159]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running(game+0x25b)[0x4efeab]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running(service_late_init+0x193)[0x48f8f3]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running(main+0x40a)[0x4743ea]
/lib64/libc.so.6(__libc_start_main+0xf5)[0x7f3163451b05]
/local/meetmaker/bin/meetmaker-3.1.0_2782 | shard1: running[0x4751e1]
==== WATCHDOG ====

{% endhighlight %}

Having downloaded the libc sources and looked at the implementation of the syslog client, we realised that the syslog() function was blocking and any delays on the rsyslog side affect the daemons.

Something had to be done, and the sooner the better. But we didn't have the time …

A few days later we stumbled upon the most unpleasant surprise in modern architecture — a cascade failure.

<img class="no-box-shadow" src="{{page.imgdir}}/14.gif"/>

Rsyslog is configured to "throttle" by default if an internal queue fills for some reason.

So we had a situation where one programmer didn't notice that a test server had started sending a huge quantity of messages to the log. Logstash couldn't cope with this influx: the main rsyslog queue overflowed and Logstash started reading messages from other rsyslogs very slowly. Because of this, other rsyslogs also overflowed and started to read daemon messages very slowly.

And daemons, as I said above, write in /dev/log synchronously and without timeout.
The result was predictable: all the daemons that were writing in syslog at any significant frequency started to stall.

Another mistake was not telling the system administrators about the potential problem, meaning that it took more than an hour to root out the cause and disable rsyslog.

It turned out that <a href="http://www.gossamer-threads.com/lists/rsyslog/users/7949" target="_blank">weren't the only ones</a> to come across these issues. And not even <a href="https://coreos.com/blog/eliminating-journald-delays-part-1.html" target="_blank">just with rsyslog</a>. Synchronous calls to the event loop of the daemon is an unattainable luxury.

We had a few options.

- Leave syslog and go back to one of the other options that had one daemon writing to the disk, and a completely different daemon reading from the disk.
- Continue to write in syslog synchronously, but in a separate thread.
- Write our own syslog client and send data to the syslog using UDP.

The best option seemed to be the first. But we didn't want to spend time on it and quickly got to work on option three.

As far as Logstash was concerned, two startup options solved all the issues: increasing both the number of processors and the number of lines processed concurrently (*-w 24 -b 1250*).

## Plans for the future

In the near future we have plans to make a dashboard for our daemons. This dashboard will combine existing features with some new ones:

- Display of daemon performance (so-called "traffic lights") and basic statistics.
- Graphs showing ERROR and WARNING lines in the logs.
- Triggered alerts from the message system.
- SLA monitoring, displaying the problematic services or requests.
- Daemon stages.
For example, what stage of loading it isin, the loading time, the duration of some periodic process etc.

This type of dashboard suits everyone, in my opinion: managers, programmers, administrators and those responsible for monitoring.

## Conclusion

We built a simple system that collects logs of from all our daemons, letting us conveniently search through them and build graphs and visualization. It also emails us about any problems.

The fact that we were able to promptly discover a lot of problems that  previously would not have been found at all, or only after some time, speaks to the success of the system, as does the fact that other teams have started using the infrastructure.

Concerning load: currently in the course of the day we get anywhere from 600 to 2000 lines per second, with periodic bursts of up to 10,000lines. The system handles this load without any problems.

<img class="no-box-shadow" src="{{page.imgdir}}/15.png"/>

The daily index size ranges from about ten to hundreds of gigabytes.

<img class="no-box-shadow" src="{{page.imgdir}}/16.png"/>

Some of you might focus on the system's flaws or that some issues could have been circumvented if we had done something differently. This is, of course, true. But at the end of the day, we don't program for the sake of programming. Our goal was achieved on a tight schedule and the system is so flexible that anything that ceases to be useful in the future can be easily improved or changed.

**Marko Kevac, programmer in C/C++ Division**
