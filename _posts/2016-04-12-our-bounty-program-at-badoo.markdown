---
layout: post
title:  Our Bounty Program at Badoo
author: Ilya Ageev
date:   2016-04-12
categories: PHP
excerpt: Many IT companies now have their own bounty programs (i.e. programs that root out vulnerabilities), and Badoo is no exception.
---

Many IT companies now have their own bounty programs (i.e. programs that root out vulnerabilities), and Badoo is no exception.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png" style="float:left; width: 40%; margin-right: 10px;"/>

In this article, we'll discuss how we launched and support our bounty program without a dedicated information security division. We'll discuss some of the problems we've encounted, how we solved them, and how we ended up with the program we use today. And, of course, we'll recall some of the more interesting bugs that program participants have let us know about.

The bounty program has been running for three years, and participants from all over the world continue to report bugs to us.

We'd like to draw even more interest from foreign investigators, so we've opened our own page on the largest hacker portal <a href="https://hackerone.com/badoo" target="-blank">hackerone.com</a>, and increased the reward for finding vulnerabilites! Depending on the category, rewards range from **£100** to **£1000**, and grand prize rewards are now **£2000**. The upper cap on rewards can go even higher if one finds a vulnerability that presents a real threat to our users.

Badoo is one of the foremost social networking services in the world. Through Badoo, you can meet your better half, start up new friendships, or just find someone nearby to chat with.

Currently, Badoo has over 300 million registered users that speak more than 50 languages and live around the world. Our work is supported by around 3000 servers located in four data centers (in America, Europe, Asia, and Russia). We offer an assortment of apps for all popular mobile platforms, the mobile web, and web versions for desktop browsers. We are a highload project; at peak traffic we handle 70-80 thousand requests per second.

Given the scale of our project, our time and resources are understandably spread in many different directions, only one of which being information security.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png" style="float:left; width: 40%; margin-right: 10px;"/>

It might strike some as strange then that we have no information security division or any specialists that handle our security issues exclusively.

Nevertheless, our users are very dear to us and we care about the security of their data. Despite the fact that we don't support the features that a bank does, such as an online payment system, or a way to withdraw funds (although we do have a system for receiving our internal "Badoo credit" currency), we still have a lot of data that needs to be protected.

To further complicate the matter, we adhere to the standard business wisdom that any security efforts shouldn't impinge on the customer's ease of use. For example, we have a feature that allows users to access their account directly from an email link, without having to re-enter their username and password. From a data security point of view, this is risky, however we take all necessary precautions and employ mechanisms to protect user data in such cases. But, of course, no system is perfect.

It's difficult to answer the question "Why don't you have a dedicated security division?", but we'd ask that you keep in mind that our project grew from a small start-up. And any start-up is initially focused on developing quickly and reaching certain business goals, rather than focusing primarily on things like quality, security, and other areas that are the realm of mature projects. For this reason, the majority of startups don't get off the ground thinking about their testing division, and put off thoughts of an information security division till even later. This is to be expected.

At our company, we still employ certain methods and approaches that are more characteristic of a startup. Though we've dealt with information security from the very beginning (and our guys are consummate pros), we haven’t had a systematic approach to the issue. The day will almost certainly come when we will either employ dedicated specialists or create an entire information security division.

But for now, these are the security measures we take in addition to supporting the bounty program:

- System administrators handle infrastructure, network, and related security issues. They started dealing with these issues earlier than all the other teams.
- Developers check their code for security issues and potential errors (including during code review).
- Testers also manually test for the security of individual features (for example, unauthorized access or code injection) during autotests and task validation.
We regularly run checks using automated tools, primarily Skipfish and Acunetix.
- We hold the highest level of PCI DSS certification. Frequent information security measures are undertaken in accordance with this standard: complete isolation of development and code deploy processes from the payment-processing tools; regular penetration testing, regular infrastructure audits, and much more. Carrying out these measures have not only allowed us to achieve the highest category of the security standard, but also to maintain our certification for the past several years.
- We've tried to design our code development system, framework, template engine, runtime environment, etc., to minimize the potential for errors as well as the negative consequences if they do occur. A simple example of this is that we patched our php-fpm so that it only uses PHP code from certain directories (with no write access, of course). This way, even if some third-party code manages to reach our servers, we minimize the launch risk.

Third-party security specialists have also helped us a lot. Some of them we reached out to, others reported bugs to us on their own volition and were rewarded for it. But the process itself hasn't proceeded in an organized fashion, so we've decided to systematize it.

We first started to seriously consider having a permanent bounty program a few years ago, motivated on one hand by the challenge and its potential to propel us to a new level and, on the other hand, by the fact that this could help us figure out where we stand as far as security goes.

## Preparation

It goes without saying that we didn't start by immediately trying to launch the program, but rather by running a few internal checks to ensure us that we were ready for the next steps.

- We made sure that access to databases and other resources was in order. We checked the startup rights, write rights, and other actions for system users on the servers. It goes without saying that this amounted to quite a bit of work and a lot of things had to be redone in order to satisfy the new requirements. We changed the API access in a few spots so that it'd be easier to monitor.
- We strengthened our defense against XSS attacks on our template-creator system. Now everything is escaped by default, rather than just when a programmer explicitly writes for it to be.
- We also went through a few stages of internal audits on our entire system, code and environment.
- We put together tools for processing user reports. Launching a big program is not something we wanted to do right away. To start, we decided to experiment by launching it for a month. Given the time frame, we also didn't want to spend much time messing around with tools. First, we organized a system to process reports in Google Groups (we use Google Mail at Badoo). The interface is very customizable, so it was easy to put together categories for things like whether the report was received yet, what category it was assigned, whether it had been processed yet, and if money had been paid out.
- We decided to start with the main website in order to see how effective the program would be.
- Also, we decided to stick with the Russian internet at first for a few reasons: we were already acquainted with a few top-notch Russian hackers who had asked to participate, and we wanted to avoid an international fail in the event that the program proved unsuccessful.

In the corporate site's interface, we put together a page listing reports along with their statuses and categories. Descriptions of vulnerabilities were shown only after they'd been fixed. New reports could also be sent in through this page.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

This format was very convenient: participants got an email from us with their report number and could track it in the list. They could also share the link to the page with others, raising their own karma.

For additional motivation, we created a participant rating system which was based not only on the number of reports from a given person, but also how critical they were. At the end of the month, we rewarded the leaders with special prizes.

This page also helped us point out duplicate entries. If a participant submitted a duplicate report, they got a notification containing the number of the report that had already been accepted. As a result, they could then track the status of that report.

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>

As far as rating the bugs found by participants, we decided not to use any of the widely-used systems of vulnerability assessment like OWASP. To the contrary, we assigned categories based on the potential harm that a given vulnerability might inflict on our users. In total, we created five categories and standard rewards ranged from 50 – 500 pounds sterling.

At first glance, this may seem like a strange approach, but some of the less critical vulnerabilities according to OWASP [www.owasp.org] could inflict the most harm on our users, so they needed to be ranked higher. To this effect, we even offered super-rewards of £2000 or more for discovering especially critical vulnerabilities. We decided to also encourage our investigators to think of the most effective vector of attack (rather than just pointing out the error’s existence). Further on in this article, we'll give an example of a simple XSS-vulnerability that we paid a super-reward for because of the unusual and particularly interesting method of attack the participant indicated.

## Contest

Thus, D-Day was underway. We launched the program, announced it via several sources, and sat back waiting for the results. Keep in mind that this program was only in effect for a month. It was a stressful, but very productive time for us. Here are the results of "security month" at Badoo:

- We received over 500 reports of potential risks
- About 50 of them turned out to be duplicates
- Around 150 reports were just bugs or improvement suggestions that had nothing to do with security
- A little over 50 of them concerned actual vulnerabilities
- About half of the vulnerabilities were types of CSRF

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>

The majority of bugs reported over the course of several days were CSRF. Pages where users fill in information about themselves, upload photos, etc. were the most impacted. It’s not as if we had no defense against CSRF attacks at that time though. Indeed, many of our pages were protected using session tokens. Nevertheless, it turned out that not all user actions on the site were protected from CSRF threats.

We responded quickly and launched a major project to defend user data against CSRF in the course of a few days. All pages and web services were redone to check CSRF tokens by default. This way, we got rid of practically all CSRF vulnerabilities on our site.

## Interesting bugs

<img class="no-box-shadow" src="{{page.imgdir}}/6.png" style="float:left; width: 40%; margin-right: 30px;"/>

The top three most embarrassing bugs that we discovered during Security Month were the following:

- Our app contains a "credit" system –users change real money for our internal currency that can then be used to buy certain services. The error that was found was a very stupid one and had been in our system for quite some time. Yet we wouldn't have found out about it if we hadn't launched the bounty program. The main problem was that despite our precautions, a mistake in the code was causing the number of credits that the user should receive after payment to be taken directly from the form. So by changing these values in the page’s html code, hackers could get away with paying a small amount and then crediting their account with a much higher figure than they were due. We analyzed transactions and paid a respectable sum to the person who discovered this vulnerability (despite the fact that no one else had taken advantage of it).
- The second bug was almost as simple. It concerned a handler that was not validating a parameter value correctly. This parameter identifies users when they make changes to their data. As a result, when user_id was changed in a request, it was possible to change certain information belonging to other users. As you can see, both of these errors are simple, but they were given the highest rating.
- And the third bug? Users can link their external social network accounts to their Badoo account, and then log in from these other accounts. Someone found an error in the linking mechanism that allowed one to link their external social network account to the Badoo account of a different user, thus gaining access to someone else's profile.

## What's next?

During the contest, we learned to respond quickly to participant reports (within a few hours), fix the bugs, and create a separate project dedicated to defense against CSRF-attacks. It was clear that this program was important and essential. The time and resources spent preparing for and implementing it were more than justified. So we decided to take things further and began preparing for a permanent security vulnerability search program. First we just needed to change the format a bit.

During the contest month, we learned how a convenient report processing flow should look and decided to switch it over to JIRA (all our company's tasks are handled using this system).

The simple flow in Google Groups looked like this:

<img class="no-box-shadow" src="{{page.imgdir}}/7.png"/>

Participant reports came to us from one of two paths: either via the form on the corporate site or via the special email address. The contest jury carefully evaluated reports and, in the case of real threats, sent them to specific teams to be dealt with. Our developer relations manager helped us handle communications with participants at this stage, although many of the emails could have been generated automatically.

The flow in Jira, which we put together for the permanent program, looks a bit different and allows for automated answers to be sent to participants.

<img class="no-box-shadow" src="{{page.imgdir}}/8.png"/>

We also decided to add mobile apps to the permanent program.

Around this time we ended up on the <a href="https://bugcrowd.com/list-of-bug-bounty-programs" target="_blank"> Bugcrowd</a> bounty list, which upped our popularity and helped draw the attention of investigators from all over the world. Having made our big appearance, we proceeded to launch the program.

## Results of the permanent program

Unfortunately, results of the permanent program haven’t proved to be quite as impressive as the contest month’s, as we receive more irrelevant vulnerability reports than we did before. Nevertheless, we were tipped off to several interesting bugs during the first year of the "big" program.

- We were sent about 870 reports
- About 50 of these concerned actual security vulnerabilities
- More than 30 of the reports sent during the first year turned out to be duplicates
- More than 20 of the bugs concerned mobile apps

<img class="no-box-shadow" src="{{page.imgdir}}/9.png" style="float:left; width: 40%; margin-right: 10px;"/>

As we expected, our program generated a lot of buzz, and the number of useful reports we received was not insignificant, so all in all, we are satisfied with the results.

<div style="clear:both"></div>
<br/>

## Interesting bugs

Many of the interesting bugs found during the first year concerned our mobile apps. We were, of course, grateful to find out about them, as this area is new territory for developers and hackers alike.

Here are the top three bugs found during the first year of the program:

- A special prize was awarded for the discovery of a vulnerability with a very atypical attack vector. We use a comet server to send messages of various types over already open connections in many places. This technology is also used to show "pencils" in messengers, i.e. the standard indication that someone is currently writing to you. This type of message contained an unused field left there from past troubleshooting, and it was possible to enter random data in it. This random data was transmitted "as is" to the user receiving your message, and was processed there as html. This involved atypical XSS, content spoofing, DDoS, and many other factors. To top it off, the victim didn't have to do anything other than open their messenger. Given that this vulnerability could have been exploited on a mass scale, we decided to award a special prize for its discovery. The fix was a quick and simple one: we just deleted the unused field. Then we checked all analogous areas.
- The second interesting error was found in Badoo's mobile app for Android. Our developers discovered an intriguing hack at one point: to speed up rendering, they used their own handler via addJavascriptInterface in the Android API on screens using webview, which basically did nothing other than instantiation. And in the case of MitM attacks (when you can't completely trust the data arriving to the client) JavaScript hackers can get into the interface. This way, random code could be executed on client devices.
- The third bug (sent to us by the same person as the previous one) had to deal with our cache loader in the Android app not adequately checking the path to the cache itself. As a result, it could be used to get app files (after all, the loader works with the same rules as the app) including authorization keys to external systems (for example, in order to log in through Facebook, Vkontakte, etc.).

All in all, we feel that the program has proved very rewarding and effective. We get expert feedback on our apps and sites every day from hackers all over the world and work to improve our services based on the latest findings in the field of information security. We value the trust of our users and aim to do everything we can to protect their information.

We'd love for you to participate in our program and apply your skills to seeking out bugs on the sites and apps of other companies. The process itself is often very entertaining and you will not only come away from it with newly-acquired knowledge, but also some extra cash. We pay in pounds sterling and recently increased the prize amount substantially.

The best way to send us bug or vulnerability reports is through the <a ref="https://hackerone.com/badoo" target="_blanl">Hackerone</a> platform. Happy bug hunting!

**Ilya Ageev,**<br/>Head of QA, Badoo.

PS: While we were writing this article, <a ref="https://hackerone.com/badoo" target="_blank"Hackerone</a> let us know about more interesting vulnerabilities, which we’ll let you know about in a later post.

<img class="no-box-shadow" src="{{page.imgdir}}/10.png"/>
