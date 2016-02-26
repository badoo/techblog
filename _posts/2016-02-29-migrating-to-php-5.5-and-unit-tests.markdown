---
layout: post
title:  Migrating to PHP 5.5 and Unit Tests
author: Yuriy Nasretdinov
date:   2016-02-29
categories: PHP
excerpt: Four years have passed since our migration from PHP 4.4 to PHP 5.3 at Badoo. It is high time to upgrade to a newer PHP, PHP 5.5. We’ve had many reasons to upgrade, apart from a number of new features, PHP 5.5 has greatly increased performance.
---

Four years have passed since our migration from PHP 4.4 to PHP 5.3 at Badoo. It is high time to upgrade to a newer PHP, PHP 5.5.

We’ve had many reasons to upgrade, apart from a number of new features, PHP 5.5 has greatly increased performance.

In this article, we will tell you about our migration to PHP 5.5, about traps we fell in, and about our new system to run unit tests based on PHPUnit.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png" title="Fig. 1. General architecture"/>
*Fig. 1. General architecture*

## Problems during migration from PHP 5.3 to PHP 5.5

Last time we were migrating from the fourth PHP version to the fifth one. Notably our PHP 5.3 version featured patches to make the “old” PHP syntax work, e.g. $a = &new ClassName();, and to make our codebase work simultaneously with PHP4 and PHP5. This time we did not have limitations like that, so during migration we just found all deprecated language constructs and replaced them with newer ones. Then we were done with rewriting the code.

The main problems we faced were the following:

- Part of deprecated features of the language were removed
- Mysql extension became deprecated
- Low performance of runkit extension that we use for writing unit tests


After migrating to PHP 5.5, the execution of our unit tests’ became significantly longer, by several times in fact, so we decided to improve our test launcher one more time in order to resolve this issue.
<br/>

## Runkit and PHP 5.4+

Facebook’s xhprof extension quickly helped us to find out that our tests were running slowly due to the significantly reduced performance of the runkit extension, so we started to dig to find the cause of the problem. It was likely caused by <a href="https://github.com/zenovich/runkit/commit/1a3af5e09ff6a867b7778d2c9652c1297eeb2ddb" target="_blank">adding a mysterious runtime cache</a> for PHP 5.4 which had to be reset every time after a “runkit_*_redefine” function call.

The runkit extension runs through all loaded classes, methods and functions and resets the cache. We were naive enough to switch it off but it ended up crashing PHP, so we had to look for a different solution.

### Microsuite concept

Prior to migrating to PHP 5.5 we already had a launcher for unit tests as a phpunit addin that would split one big suite of unit tests into several smaller ones. At that moment, we were already applying tests run in 11 threads

We carried out several simple benchmarks and found that the tests can be executed several times faster if the suite is split into 128 or more parts (with fixed number of processor cores), not into 11 ones as it used to be. Every suite resulted in around 10-15 files, so we called it a microsuite concept. We’ve got around 150 microsuites, and every one of them ran suspiciously smoothly to be a queue task (a task includes a list of files for a corresponding suite, which, in its turn, launches a phpunit unit with corresponding parameters).

### Cloud tests

It turns out that the author of the article is not related to QA at all, but he was one of the main developers of a new script framework that is a sort of a “cloud” for scripts and supports the tasks’ concept (we gave talks about our cloud several times on conferences and we’ll definitely talk about it in detail on Habrahabr). Since we have tasks (file lists) for every phpunit suite, it means that we can put them into the cloud as well. Which is exactly what we’ve done. The idea is very simple: if we have multiple small tasks, they can run independently on several servers. Which means it would accelerate completion of tests even more.

**General architecture**

We run tests from several different sources:

1. Automatic test runs using our automated deployment tool called AIDA:
  - By git branch of the task;
  - By build (the code that would go to production)
  - By master branch
2. Manual test runs, initiated by developers or QA engineers from the dev-server.

All these test runs have one thing in common: the first one should fetch a branch from some source and then run the tests on this branch.
This has defined the architecture of our new cloud-based test launcher (fig. 1 in the beginning of the article):

First, one task is created for a master process, which does the following:

- Chooses an available directory in a database (fig. 2)
- Downloads a git branch from a required spot (a central repository or a dev-server)
- Runs git merge master (optional)
- Creates a new commit with all the local changes (optional)

<img class="no-box-shadow" src="{{page.imgdir}}/2.png" title="Fig. 2. List of available directories stored in MySQL"/>
*Fig. 2. List of available directories stored in MySQL*

Then the master process analyses the original phpunit suite and splits it into as many parts as required (no more than 10 files for one microsuite). The resulting tasks (“thread” processes) are then added as tasks into the cloud and are run on servers that are available.

The first task to run on a new server prepares a selected directory for test run and fetches the required commit from the server where the master process is active. To prevent other tasks for the same server from the same actions the first task does, file locks are used (fig. 3).

In order to use resources from our cluster more fully, several test runs can be active at the same time: the tests run quickly, and executing the code takes much less time than preparation of source texts.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png" title="Fig. 3. Locks for directory preparation"/>
*Fig. 3. Locks for directory preparation*

Some tests can run significantly slower than the other ones. We have timing statistics for every test, so we use it to run the longer tests in the first place. This kind of strategy allows for a more uniform load of servers during testing and for reduction of the total test time (fig. 4).

<img class="no-box-shadow" src="{{page.imgdir}}/4.png" title="Fig. 4. Time tracking for tests’ completion"/>
*Fig. 4. Time tracking for tests’ completion*

If all is ok, our suite (consisting of 28 000 unit tests) is completed in 1 minute. The tests that last longer become a bottleneck, so the system places its authors on a hall of shame that is printed at every test run. Apart from that, if few tests are left, their list is also shown (fig. 5).

<img class="no-box-shadow" src="{{page.imgdir}}/5.png" title="Fig. 5. Hall of shame: tests that are run longer than one minute"/>
*Fig. 5. Hall of shame: tests that are run longer than one minute*

The unit test launcher became the first script to be moved onto the cloud. It helped to troubleshoot multiple bugs and faults in the cloud itself, which added to much higher speed of unit tests’ completion.

<br/>

**Summary**

Migration to PHP 5.5 has allowed us to use new features of the language, has greatly reduced CPU load on our servers (average of 25% reduction) and moved our unit test launcher to the cloud. The last action let us reduce the total test timing from 5-6 minutes (and from dozens of minutes on PHP 5.5) to one minute, shifting the load from the general dev-server to the cloud.

*Yury Nasretdinov, Badoo developer*
