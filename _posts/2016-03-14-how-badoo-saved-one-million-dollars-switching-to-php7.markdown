---
layout: post
title:  How Badoo saved one million dollars switching to PHP7
author: Badoo
date:   2016-03-14
categories: PHP
excerpt: We did it! Hundreds of our application servers are now running on PHP7 and doing just fine. By all accounts, ours is only the second project of this scale (after Etsy) to switch to PHP7.
---
## Introduction

<img class="no-box-shadow" src="{{page.imgdir}}/5.jpg" style="float:left; width: 40%; margin-right: 10px;"/>

We did it! Hundreds of our application servers are now running on PHP7 and doing just fine. By all accounts, ours is only the second project of this scale (after Etsy) to switch to PHP7. During the process of switching over we found a couple bugs in the PHP7 bytecode cache system, but thankfully it’s all fixed now. Now we're excited to share our good news with the whole PHP community: PHP7 is completely ready for production, stable, significantly reduces memory consumption, and improves performance dramatically.

In this article, we'll discuss the process of switching over to PHP7 in detail, explaining what difficulties we encountered, how we dealt with them, and what the final results were. But first let's step back a bit and look at some of the broader issues:

The idea that databases are a bottleneck in web-projects is an all-too-common misconception. A well designed system is balanced: when the input load increases, all parts of the system take the hit. Likewise, when a certain threshold is reached, all components – not just the hard disk database, but the processor and the network part – are hit. Given this reality, the processing power of the application cluster is arguably the most important factor.
In many projects, this cluster is made up of hundreds or even thousands of servers, which is why taking the time to adjust the app cluster processing load more than justifies itself from the economic standpoint (by a million dollars in our case).

In PHP web apps, the processor consumes as much as any dynamic high-level language – a lot. But PHP developers have faced a particular obstacle (one that has made them the victims of vicious trolling from various communities): the absence of JIT or, at the very least, a generator of compilable texts in languages like C/C++. The inability of the PHP community to supply a similar solution within the frame of the core project fostered a suboptimal tendency: the main players started to slap together their own solutions.
This is how HHVM was born at Facebook, KPHP at VKontakte, and maybe some other similar hacks. Thankfully, in 2015, PHP started to "grow up" with the release of PHP7. Though there is still no JIT, it's hard to overestimate how significant these changes in the "engine" are. Now, even without JIT, PHP7 holds its own against HHVM (e.g. <a href="http://blog.litespeedtech.com/2015/09/04/php-7-vs-hhvm-benchmark-series-3-how-fast-can-wordpress-go/#more-3305" target="_blank">Benchmarks from the LightSpeed blog</a>  or <a href="http://www.slideshare.net/netandreus/php7-2015/7" target="_blank">PHP devs benchmarks</a>). The new PHP7 architecture will even simplify the addition of JIT in the future.

Our "platform" developers at Badoo have paid careful attention to every hack to come out in recent years, including the HHVM pilot project, but we decided to wait for PHP7's arrival given how promising it was. Now we've launched Badoo on PHP7! With over three million lines of PHP code and 60,000 tests, this project took on epic proportions. Keep reading to find out how we handled these challenges, came up with a new PHP app testing framework (which, by the way, is already open source), and saved a million bucks along the way.

## Experimenting with HHVM

Before switching over to PHP7, we spent some time looking for other ways to optimize our backend. The first step was, of course, to play around with HHVM.

Having spent a few weeks experimenting, we got quite respectable results: after warming up JIT on our framework, we saw triple digit gains in speed and CPU use.

On the other hand, HHVM proved to have some serious drawbacks:

- **Deploying is difficult and slow**. During deploy, you have to warm up the JIT-cache. While the machine is warming up, it shouldn't be loaded down with production traffic, because everything goes pretty slowly. HHVM team also doesn't recommend warming up parallel requests. By the way, the warm-up phase of a big cluster operation doesn't go quickly. Additionally, for big clusters consisting of a few hundred machines, you have to learn how to deploy in batches. Thus the architecture and deploy procedure involved is substantial, and it's difficult to tell how much time it will take ahead of time. For us, it's important for deploy to be as simple and fast as possible. Our developer culture prides itself on putting out two planned releases a day and being able to roll out many hot fixes.
- **Inconvenient testing**. We rely heavily on the runkit extension, which wasn't available in HHVM. A bit later, we’ll go into more detail about runkit, but suffice it to say, it's an extension that lets you change the behavior of variables, classes, methods, functions, practically whatever you want on the fly. This is accomplished via an integration that gets to the very "guts" of PHP.  The HHVM engine bares only a faint resemblance to PHP's, however, so their respective "guts" are quite different. Due to the extension's particular features, implementing runkit independently on top of HHVM is insanely difficult and we had to rewrite tens of thousands of tests in order to be sure that HHVM was working correctly with our code. This just didn't seem worthwhile. To be fair, we would later encounter this same problem with all other options at our disposal, and we still had to redo a lot of things including getting rid of runkit during the switch over to PHP7. But more about that later.
- **Compatibility**. The main issues are incomplete compatibility with PHP5.5 (see: <a href="https://github.com/facebook/hhvm/blob/master/hphp/doc/inconsistencies" target="_blank">https://github.com/facebook/hhvm/blob/master/hphp/doc/inconsistencies</a>, <a href="https://github.com/facebook/hhvm/issues?labels=php5+incompatibility&state=open" target="_blank">https://github.com/facebook/hhvm/issues?labels=php5+incompatibility&state=open</a>) and incompatibility with existing extensions (of which we have dozens). Both of these incompatibilities are a result of an obvious drawback of the project: HHVM is not developed by the larger community, but rather within a division of Facebook. In situations like this, it's easier for companies to change their internal rules and standards without referencing the community and volumes of code contained therein. In other words, they cut themselves off and solve the problem using their own resources. Therefore, in order to handle tasks of similar volume, a company needs to have Facebook-like resources to devote to both the initial implementation as well as continuing support. This proposition is both risky and potentially expensive, so we decided against it.
- **Potential**. Even though Facebook is a huge company with numerous top-notch programmers, we doubted that their HHVM developers would prove more powerful than the entire PHP-community. We reckoned that as soon as something similar to HHVM appeared for PHP, the former would start to slowly fade out of use.

So we patiently awaited PHP7.

The switch to the new version of the interpreter was both an important and difficult process, and we prepared for it by putting together a precise plan. This plan consisted of three stages:
- Changing the PHP build/deploy infrastructure and adapting the mass of extensions we'd already written
- Changing the infrastructure and testing environments
- Changing the PHP app code

We'll get into the details of all these stages later.

## Changes to the engine and extensions

At Badoo, we have our own actively supported and updated PHP branch, and we started switching over to PHP7 even before its official release, so we had to regularly rebase PHP7 upstream in our tree in order for it to update with every release candidate. All patches and customizations that we use in our everyday work also had to be ported between versions and work correctly.

We automated the process of downloading and building dependencies, extensions and the PHP tree for versions 5.5 and 7.0. This not only simplified our current work, but also bodes well for the future: when version 7.1 comes out, everything will be in place.

As mentioned, we also had to turn our attention to extensions. We support over 40 extensions, more than half of which are open source with our reworks.

In order to switch them over as quickly as possible, we decided to launch two parallel processes. The first involved individually rewriting the most critical extensions: the blitz template engine, data cache in shared memory/APCu, pinba statistics collector, and a few other custom extensions for internal services (in total, we used our forces to redo about 20 extensions).

The second involved actively ridding ourselves of all extensions that are only used in non-critical parts of the infrastructure in order to unclutter things as much as possible. We were easily able to get rid of 11 extensions, which is not an insignificant figure!

Additionally, we started to actively discuss PHP7 compatibility with those who maintain the main open extensions (special thanks to xdebug developer Derick Rethans).

We'll go into more detail regarding the technical details of porting extensions to PHP7 a bit later.

Developers made a lot of changes to internal APIs in PHP7, which meant we had to alter a lot of extension code.

Here are the most important changes:

- **zval * -> zval**. In earlier versions, the zval structure was always allocated for a new variable, but now a stack structure is used.
- **char * -> zend_string**. Aggressive string caching in the PHP engine is used in version 7. For this reason, with the new engine there is a complete switch from regular strings to the zend_string structure where a string is stored along with its length.
- **Changes in array API**. Now zend_string is used as a key and the array implementation substitutes a double linked list with an ordinary array that is highlighted by one block instead of a lot of smaller ones.

All this makes it possible to radically reduce the number of small memory allocations and, as a result, speed up the PHP engine by double digit percentage points.

We should note that all these changes made it necessary to at least alter all extensions (if not rewrite them completely). Though we could rely on the authors of built-in extensions to make the necessary changes, we of course were responsible for altering our own, and the amount of work was substantial. Due to changes to internal APIs, it was easier just to rewrite some sections of code.

Unfortunately, introducing new structures using garbage collection along with speeding up the code execution made the engine itself more complex and it became harder to locate problems. One such problem concerned OpCache. During cache flush, the cached file's bytecode breaks down at the moment when it could be used in a different process, so the whole thing falls apart. Here's how it looks from the outside: (zend_string) in function names or as a constant suddenly breaks down and garbage appears in its place.

Given that we use a lot of in-house extensions, many of which deal particularly with strings, we suspected that the problem was with how strings were used in them. We wrote a lot of tests and conducted plenty of experiments, but didn't get the results we expected. Finally, we asked for help from the main PHP engine developer, Dmitri Stogov.

One of his first questions was "Did you clear the cache?" We explained that we had, in fact, cleared the cache every time. At that point, we realized that the problem was not on our end, but with OpCache. We quickly reproduced the case, which helped us to replay and fix the problem within a few days. Without this fix that came out in the 7.0.4 version, it wouldn't have been possible to put PHP7 into stable production.

## Changes to testing infrastructure

We take special pride in the testing we do at Badoo. We deploy server PHP code to production two times a day, and every deploy contains 20-50 tasks (we use feature branches in git and automated builds with tight JIRA integrations). Given this schedule and task volume, there's no way we could go without autotests. Currently, we have around 60 thousand unit tests with about 50% coverage, which run for an average of 2-3 minutes in the cloud (see our <a href="https://techblog.badoo.com/blog/2014/03/01/migrating-to-php-5.5-and-unit-tests/" target="_blank">article</a> for more). In addition to unit tests, we use higher-level autotests, integration and system tests, selenium tests for web pages, and calabash tests for mobile apps. Taken as a whole, this allows us to quickly reach conclusions about the quality of each concrete version of code and apply the appropriate solution.

Switching to the new version of interpreter was a major change fraught with potential problems, so it was especially important that all tests worked. In order to clarify exactly what we did and how we managed to do it, let's take a look at how test development has evolved over the years at Badoo.

Often, people starting to think about implementing product testing (or, in some cases, having started implementation already) discover that their code is "not ready for testing" during the experimentation process. For this reason, in most cases it's important for the developer to keep in mind that his code should be testable while he's writing it. The architecture should allow unit tests to replace calls and external dependency objects in order to isolate the code being tested from external conditions. Of course, it goes without saying that this is a much-hated requirement and many programmers take a stand against writing "testable" code out of principle. They feel that these restrictions flies in the face of "good code" and often don't pay off. And you can imagine the sheer volume of code that's not written "by the rules", and results in testing being delayed "for a better time" or experimenters trying to satisfy themselves by running small tests that only cover what can be covered (which basically means the tests don't yield the expected results).

I'm not trying to say that our company is an exception; we also didn't implement testing right from the start of our project. There were several lines of code that worked fine in production and brought in cash, so it would have been stupid to rewrite them just to run tests (as recommended in the literature). That would take too long and be too expensive.

Fortunately, we already had an excellent tool that allowed us to solve the majority of our problems with "untestable code" - runkit. While the script is running, this PHP extension lets you change; delete; and add methods, classes, and functions used in the program. It also has many other functions, but we didn't use them. This tool was developed and supported for many years, from 2005 to 2008 by Sara Goleman (who now works at Facebook and, interestingly enough, on HHVM). Beginning in 2008 and continuing through the present, it has been maintained by Dmitri Zenovich (who headed the testing division at Begun and Mail.ru). We've also done our bit to contribute to the project.

On its own, runkit is a very dangerous extension. It lets you change constants, functions, and classes while the script that uses them is running. In essence, it's like a tool that let's you rebuild a plane during the flight. Runkit gets right to the "guts" of PHP on the fly, but one mistake or deficiency makes everything go up in flames and either the PHP fails or you have to spend a lot of time searching for memory leaks or other low-level debugging. Nonetheless, this tool is essential for our testing: implementing project testing without having to do major rewrites can only be done by changing the code on the fly.

But runkit turned out to be a big problem during the switch to PHP7 because it didn't support the new version. We could have sponsored the development of a new version, but, looking at the long-term perspective, this didn't seem like the most reliable path to pursue. So we looked at a few other options.

One of the most promising solutions was to shift from runkit to uopz. The latter is also a PHP extension with similar functionality that launched in 2014. Our colleagues at Wamba suggested uopz, focusing on its impressive speed. The maintainer of the uopz project, by the way, is Joe Watkins (First Beat Media, UK). Unfortunately, however, switching all our tests to uopz didn't work out. In some places there were fatal errors, in others - segfaults. We created a few reports but there was no movement on them, unfortunately (e.g. <a href="https://github.com/krakjoe/uopz/issues/18" target="_blank">https://github.com/krakjoe/uopz/issues/18</a>). Trying to deal with this situation by rewriting tests would have been very expensive, and more issues could very well have emerged even if we did.

Given that we had to rewrite a lot of code no matter what, and were dependent on external projects like runkit or uopz regardless of how problematic they were, we came to the obvious conclusion that we should rewrite our code to be as independent as possible. We also pledged to do everything we could to avoid similar problems in the future, even if we ended up switching to HHVM or any similar product. This is how we arrived at our own framework.

The system got the name "SoftMocks", with "soft" highlighting the fact that the system works on clean PHP without the use of extensions. The project is <a href="https://github.com/badoo/soft-mocks/" target="_blank">open source</a> and is available in the form of an add-on library. SoftMocks is not tied up with the particulars of PHP engine implementation and works by rewriting code "on the fly", analogously to the <a href="https://github.com/goaop/framework" target="_blank">Go AOP! framework</a>.

Tests in our code primarily use the following:

1. Implementation override of one of the class methods
2. Function execution result override
3. Changing the value of global constants or class constants
4. Adding a method to a class

All these things are implemented successfully using runkit. Rewriting code makes all this possible with some reservations.

Though we don't have space to go into much detail about SoftMocks in this article, we plan on devoting a separate article to this topic in the future. Here we'll hit some of the main points:

- Custom code is connected through the rewrite wrapper function. Then all include operators are automatically overridden as wrappers.
- Checks for existing overrides are added inside every custom method definition. If they exist, then the corresponding code is executed. Direct function calls are replaced by calls through the wrapper; this lets us catch both built-in and custom functions.
- Calls to the wrapper dynamically override access to constants in the code.
- SoftMocks works with Nikita Popov's <a href="https://github.com/nikic/PHP-Parser" target="_blank">PHP-Parser</a>: This library isn't very fast (parsing is about 15 times slower than token_get_all), but the interface lets you bypass the parse tree and includes a convenient API for handling syntactic constructions of indeterminate difficulty.

Now to get back to the main point of this article: the switch to PHP7. After switching the project over to SoftMocks, we still had about 1000 tests that we had to fix manually. You could say that this wasn't a bad result, given that we started with 60,000 tests. By comparison with runkit, test run speeds didn't decrease, so there are no performance issues with SoftMocks. To be fair, we should note that uopz is supposed to work significantly faster.

## Utilities and app code

Though PHP7 contains many new developments, there are also a few issues with backward compatibility. The first thing we did to tackle these problems was read the official <a href="http://php.net/manual/en/migration70.php" target="_blank">migration guide</a>. From this it quickly became clear that without fixing the existing code, we were risking both getting fatal errors in production and encountering changes in code behavior that wouldn't show up in logs, but would nonetheless cause the app to misbehave.

Badoo has several PHP code repositories, the biggest of which contains more than 2 million lines of code. Furthermore, we've implemented many different things in PHP, from our web business logic and backend for mobile apps, to testing utilities and code deploys. Our situation was further complicated by the fact that Badoo is a project with a long history; we've been around for ten years now and, unfortunately, the legacy of PHP4 is still very present. At Badoo, we don't use the "just stare at it long enough" method of error detection. The so-called Brazilian System - whereby code is deployed in production as is and you have to wait and see where it breaks - carries too high a risk that the business logic will break down for a large percent of users and is thus also an unworkable option. For these reasons, we started looking for ways to automate the search for places of incompatibility.

Initially, we tried to use IDE's, which are very popular among developers, but, unfortunately, they either don't support the syntax and features of PHP7 yet, or they didn't function well enough to find all the obviously dangerous places in the code. After conducting a bit of research (i.e. googling), we decided to try the <a href="https://github.com/Alexia/php7mar" target="_blank">php7mar</a> utility, which is a static code analyzer implemented in PHP. This PHP7 utility is very simple to use, works fairly quickly, and gives you your results in a text file. Of course, it's not a panacea; there are both false positives and failures to find particularly well-hidden problem spots. Despite this, the utility helped us root out about 90% of the problems, which dramatically sped up and simplified the process of getting the code ready for PHP7.

The most commonly encountered and potentially dangerous problems for us were the following:

- Changes in the behavior of func_get_arg() and func_get_args(). In the 5th version of PHP, these functions return argument values at the moment of transmission, but in version seven this happens at the moment when func_get_args() is called. In other words, if the argument variable changes inside the function before func_get_args() is called, then the behavior of the code may differ from that of version five. The same thing happens when the app's business logic breaks down, but there is nothing in the logs.
- Indirect access to object variables, properties, and methods. And once again, the danger lies in the fact that the behavior can change "silently". For those looking for more information, the differences between versions are described in detail <a href="http://php.net/manual/en/migration70.incompatible.php" target="_blank">here</a>.
- Use of reserved class names. In PHP7, you can no longer use bool, int, float, string, null, true and false as class names. And yeah, we had a Null class. Its absence actually makes things easier though, because it often resulted in errors.
- Many potentially problematic foreach constructions that use a reference were found.  Since we tried earlier not to change the iterable array inside foreach or count on its internal pointer though, practically all of them behaved the same in versions 5 and 7.

Remaining instances of incompatibility were either rarely encountered (like the 'e' modifier in regular expressions), or they were fixed with a simple replacement (for example, now all constructors should be named __construct(). Using the class name is not permitted).

But before we even started fixing the code, we were worried that as some developers were making the necessary compatibility changes, others would continue to write code that was incompatible with PHP7. To solve this issue, we put a pre-receive hook in every git-repository that executes php7 -l on changed files (in other words, that makes sure the syntax matches PHP7). This doesn't guarantee that there won't be any compatibility issues, but it does clear up a host of problems. In other cases, the developers just had to be more attentive. Besides that, we started to run the whole set of tests on PHP7 and compare them with the results on PHP5.

Additionally, developers were forbidden from using any new feature of PHP7, i.e. we didn't disable the old pre-receive hook php5 -l. This allowed us to get code compatible with versions 5 and 7 of the interpreter. So why is this important? Because in addition to problems with the PHP code, there are potential issues with PHP7 and its extensions themselves (we can personally attest to them, as evidenced above). And unfortunately, not all problems were reproduced in the test environment; some we only saw under heavy load in production.

## Launch into Battle and the Results

Clearly we needed a way to simply and quickly change PHP versions on any quantity and type of server. To enable this, all paths to a CLI-interpreter in all the code were replaced with /local/php, which, in turn, was a symlink to either /local/php5, or /local/php7. This way, to change PHP versions on the server, we had to change the link (an atomic operation is important for cli-scripts), stop php5-fpm and launch php7-fpm. In nginx, we could have had two upstreams for php-fpm and launched php5-fpm and php7-fpm on different ports, but we didn't like the complicated nginx configuration.

After executing everything listed above, we switched to running Selenium tests in the pre-production environment, which turned up several problems that were not noticed earlier. These problems concerned both the PHP code (for example, we could no longer use the outdated global variable $HTTP_RAW_POST_DATA for the benefit of file_get_contents("php://input")), as well as extensions (where there were various types of segmentation errors).

After fixing the problems discovered at the earlier stage and rewriting the unit tests (during which we also found a few bugs in the interpreter like <a href="https://bugs.php.net/bug.php?id=71018" target="_blank">this</a>), we finally went into what we call "quarantine" production. This is when we launch a new version of PHP on a limited number of servers. We started with one server in every major cluster (web backend, mobile apps backend, <a href="https://tech.badoo.com/presentation/129/badoo-v-oblakax-reshenie-dlya-zapuska-cli-skriptov-v-oblake/" target="_blank">cloud</a>) and increased the quantity little by little if no errors occurred. The first large cluster to completely switch to PHP7 was the cloud, because there are no php-fpm requirements for that cluster. The fpm clusters had to wait for us to find (and then for Dmitri Stogov to fix) the OpCache problem. After that was taken care of, we also switched over the fpm clusters.

Now for the results. In brief, they are really quite impressive. Here you see the rusage response time graph, memory consumption and processor use in the largest of our clusters (consisting of 263 servers), and the mobile apps backend in the Prague data center.

**Request time distrubition:**

<img class="no-box-shadow" src="{{page.imgdir}}/1.png" title="Request time distrubition"/>

**RUsage (CPU time):**

<img class="no-box-shadow" src="{{page.imgdir}}/2.png" title="RUsage (CPU time)"/>

**Memory usage:**

<img class="no-box-shadow" src="{{page.imgdir}}/3.png" title="Memory usage"/>

**CPU load (%) on the mobile backend cluster:**

<img class="no-box-shadow" src="{{page.imgdir}}/4.png" title="CPU load (%) on the mobile backend cluster"/>


With all this in place, process time was cut in half, which improved overall response time by about 40% since a certain amount of request processing time is spent communicating with the database and daemons. Logically, we didn't expect this part to speed up by switching to PHP7. Besides this, the overall load on the cluster fell below 50 percent thanks to <a href="https://ru.wikipedia.org/wiki/Hyper-threading" target="_blank">Hyper-Threading</a> technology, further contributing to the impressive results. In broad terms, when the load increases to over 50 percent, HT-engines, which aren't as useful as physical engines, start working. But that's already a topic for another article. Additionally, memory use, which had never been a bottleneck for us, was reduced by roughly eight times over! And finally, we saved on the number of machines. In other words, that number of servers can withstand a much greater load, which lowers expenditures associated with acquiring and servicing equipment. Results on the remaining clusters were similar, with the exception that gains on the cloud were a bit more modest (around 40% CPU) due to the lack of OpCache.

So how much money did we save? Let's tally it up! An app server cluster at Badoo consists of a bit more than 600 servers. By cutting CPU usage in half, we free up around 300 servers. If you consider the initial price of this hardware is ~$4K and factor in depreciation, then it works out to about a million dollars in savings plus $100,000 a year in hosting! And this doesn't even take the cloud into consideration, which also saw a performance boost. Thus we are very pleased with the results.

Have you also made the switch to PHP7? We'd like to hear your opinion and will be happy to answer questions left in the commentary.

**Badoo Team**
