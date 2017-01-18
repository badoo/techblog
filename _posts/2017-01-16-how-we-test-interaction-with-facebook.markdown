---
layout: post
title:  How we test interaction with Facebook
author: Vitaliy Kotov
date:   2017-01-16
categories: Testing Api
excerpt: We have various ways of verifying users. Some of these are pretty standard, such as verification using a phone number. There is also a more unusual method - verification by photograph. But the simplest and quickest way is verification via using social networks.
---
<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

Hello, everybody! For ages now, I have been wanting to write an article about how automated testing is set up at Badoo. I wanted to write something which would be both interesting and useful. I wanted to share experiences that would be easy to put into practice in almost any system. And now the time has come...

As many of you know, Badoo is a social network which focuses on finding new friends and acquaintances. One of the most important tasks it must take care of is user verification.

We have various ways of verifying users. Some of these are pretty standard, such as verification using a phone number. There is also a more unusual method: verification by photograph. But the simplest and quickest way is verification via using social networks.

This means of verifying a profile is available right from the moment a profile is created/registered via a social network. **First** of all, it is quick: one click and no need for any additional steps using a phone or web cam.
**Secondly**, it is convenient, since, if you want, you can import photographs and information about yourself instead of entering them manually.

Today I would like to tell you about how registration and verification via Facebook is set up on Badoo and how we taught Selenium some tests to check them.

## How registration via Facebook works

Right, let’s imagine that you are a new user of Badoo. You go onto the site and see a registration form. Do you fill in all the fields or do you click on registration via Facebook? For me there’s never any question. I would always fill in all the fields manually and I wouldn’t link the accounts.
Why? Because I am a bit paranoid. I hope my paranoia isn’t catching. :)

In actual fact, Badoo never posts any information from another source without obtaining consent from the user, so you can feel free to click the dark-blue button and register on the site. One click, 10-15 seconds, and your Badoo profile will be verified. Hurrah!

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

What would a real QA engineer do next, after creating a profile on the service so simply and quickly? Of course, he would try to create another one! What will the service do if someone tries to register another profile using the same FB account?

Open up the registration page again and click on FB. This is nothing out of the ordinary; Badoo ‘recognises’ the FB account and instead of registering a new profile, straightaway authorises the existing one. Everything’s fine.

## First Selenium test for registration

Now let’s imagine that you are a QA engineer at Badoo. Your task is to automate the registration and authorisation flow via a FB account. At first glance this seems like a simple task. This is what you need:

- A FB account;
- A locator for the FB button on the registration page;
- A method for waiting for an authorised cookie (to check that the test has logged onto the site);
- A locator for the sign out button in order to sign out;
- A method for waiting for the authorised cookie to expire.

After the necessary methods have been written up, we write a list of scenario:

- Open start page;
- Click on Facebook icon;
- In the tab which opens up, authorise on Facebook;
- Wait for authorisation on Badoo;
- Obtain user id (let’s say **first_user_id**);
- Log out;
- Open start page;
- Click on the Facebook icon;
- Wait for authorisation from Badoo;
- Obtain user id (let’s say **second_user_id**);
- Check that **first_user_id** and **second_user_id** coincide.

So, the step-by-step list is ready, you have launched the test and it passes. Everything is wonderful. Time to be as happy as this kitten!

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

We commit the test code to the branch, send the task for review and head off to get a coffee. But before we make it to the kitchen there is a message – the task has not passed the review because the test doesn’t work. Something has gone wrong...

After we have restarted the test, it becomes clear that the problem is as follows: the FB account in question already has a Badoo profile. Instead of registering a new profile, the test immediately authorises the existing one. There’s nothing else for it: you need to delete the profile once the test is finished. Thankfully, we have the amazing QaApi!

Several years ago, I told the story of how QaApi is integrated with our auto-tests. The piece was entitled, “Selenium tests. From RC and one user to WebDriver, Page Object and a pool of users.”

In brief, this is an internal API to which you can send a request and perform various actions on the app side from within the test. It is quite easy to activate:

{% highlight html %}

QaApiHelper::deleteUser(user_id);

{% endhighlight %}

It goes without saying that QaApi is only able to work with test users and is only accessible via an intranet.

When the test had learnt to delete a user after itself, it starting working consistently and well. But not for long.

**Stages of Badoo testing**

Almost at every conference we tell people what testing stages we have in our company. Let me briefly list those which are of interest from the perspective of Selenium tests:

- **Devel environment testing**: Devel is a copy of production with its own bases and internal services.
- **Shot testing**: Shot is a production environment which is accessible from an intranet via a certain URL, and which is a merge of master code and the task being tested.
- **Staging testing**: Staging is traditionally the result of a merge of the release branch and the master.
- **Production testing**.

First of all, we ran devel environment and staging tests. However, over time, we came to the conclusion that we needed to be able to run shot tests too. The reason is quite simple: devel doesn’t always copy production ideally, and it is not a good thing to catch a bug at the staging stage and remove the function from the release. This means that the task won’t make it into this release and will make it out later than planned.

## Parallel Selenium tests for registration

Let’s get back to our test. Imagine that you are that self-same QA engineer who is now tasked with teaching the registration test to work in parallel on several shots and on staging.

Let me remind you that shots work in a production environment, that is to say, they have the same user base. It is quite obvious that in the present set-up it is not possible to run tests in parallel. If you activate two of these tests a couple of seconds apart on different shots, then the second test tries to create a profile on Badoo when the first has already created one, and it will inevitably fail:

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>

How can we solve this problem of ours? How can we make sure that the test always has a fresh FB user?

At first I tried to solve this problem the simplest way. I created an mysql table into which I imported several manually-created FB users and marked their status as ‘available’. The test took a user from this table, and changed their status to ‘busy’. If there was no available user, the test crashed, giving the relevant notification.

This system had several evident drawbacks. First and foremost, if too many test instances were activated at the same time, there were not enough accounts available and there was nowhere to get them from. Also, for some reason, the test might fail to surrender the user at the end (for example if it was stopped by pressing ‘Ctrl+C’). None of this was appreciated on mornings when there was less than an hour to go before the release deadline.

I pretty soon got tired of unstable crashes and out-of-control statuses with FB accounts and began to look for a better solution…  

## The Graph API

Facebook has a great API which allows you to create test users and to operate them — <a href="https://developers.facebook.com/docs/graph-api" target="_blank">developers.facebook.com/docs/graph-api</a>. It is organised pretty simply: you formulate the request you need and then send it to the FB server, after which the answer comes back in json format.

Here is an example of a request which registers a test user with the name Alex: <a href="https://graph.facebook.com/%7bAPP_ID%7d/accounts/test-users?name=Alex&access_token=%7bAPP_ID%7d%7C%7bSECRET" target="-blank">https://graph.facebook.com/{APP_ID}/accounts/test-users?name=Alex&access_token={APP_ID}|{SECRET}</a>

You receive an application id and secret when you register your application on FB (for more details see here — <a href="https://developers.facebook.com/docs/facebook-login/overview" target="_blank">developers.facebook.com/docs/facebook-login/overview)</a>.

A real pool of Facebook users. Go for it: let’s create users! :)

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>

Having carefully studied graph-api and its distinctive features, we put together the following list of minor issues:

- The number of registrations per application is limited. Quote: “For each application you cannot create more than 2000 test users.”
<br>
*Conclusion: you need to keep count of users.*
- A test user which has just been created can only interact with one application. In this case the application is the domain where the service is located. In Badoo, staging and shots are in different domains.
<br>
*Conclusion: when you keep count of users you need to categorise them by app id.*
- Registering a user is quite a slow process. On average, it takes 2 to 5 seconds.
<br>
*Conclusion: it is more convenient to have a FB user available which was created earlier, so that the test doesn’t waste time creating a user*.
- The test should relate to an account which has probably not been used in another test, in order to avoid face condition fluctuations.
<br>
*This point is important in the context of the test described here*.

Conclusion: It would be cool to have a custom pool of FB users matching our ‘wish list’. Basically, it needs to be a table which would contain the following information:

- User ID
- Email
- Password
- App id
- App Secret
- User status – busy (being tested) or not
- Timestamp in respect of creation of user

In addition to this table we also need several scripts.

The first one searches for users in our pool which have been busy for more than several minutes and marks them as available. This makes it easier to share these users between automated and manual testing (so long as the automation guarantees unlock on completion).

The second one resolves the problem of how long it takes to create a user from the Facebook side. It looks like this:

<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>

We have bundled obtaining a FB user into the special QaApi method. The test requests an available user from QaApi. If there isn’t one, a special task is created. As part of this task the script sends a curl-request to graph-api, waits until it obtains an answer, and then records the new user in the table. If the test receives the answer “Please wait”, it closes down the connection and retries after a few seconds. In this way, we solved two problems. Firstly, the logic for working with graph-api is separated from the logic for the tests. Secondly, the tests do not remain connected to peripheral services for a long time, which makes it substantially easier to debug any problems related to an increase in testing times.

We then rewrote the necessary tests for the new system for obtaining FB accounts and left the tests to run overnight with our CI server (we use <a href="https://www.jetbrains.com/teamcity/" target="_blank">Teamcity</a>). By the morning, the result was ready. The number of users created was precisely the number needed for use in the tests.

The pool has a quite convenient method interface. This allows you at any moment in time to obtain the ratio of available users to the total number of users for each application, and to obtain the number of users created on a given date. This allows you to check that the pool is balanced when a new test using FB accounts is added.

## Conclusion
At the present time, the pool is an integral part of our system. New scripts and new methods have emerged in connection with it. The system’s flexibility and simplicity make it easy to develop and control.

Here are some things we can say about what we have achieved in the end:

- A convenient tool for manual and automated interaction between Badoo and Facebook;
- Over 20 unique tests using a pool of Facebook accounts: registration/authorisation, verification, loading photographs from FB accounts, searching for friends on Badoo, sharing rewards and so on;
- The pool comprises 9 different applications using a total of approx. 1.5 thousand active users;
- QaApi methods are able to create FB accounts, add them as ‘friends’ to one another, upload a photograph and link FB accounts to our test users;
- The system supports the necessary number of FB accounts and usually doesn’t require any manual intervention.

Having used API for over a year, we find it has worked consistently. The only problem which arose was with users’ tokens, but the Facebook developers fixed that problem pretty quickly. If you are interested, here are the details — <a href="https://developers.facebook.com/bugs/1662068220677444/" target="_blank">developers.facebook.com/bugs/1662068220677444</a>.

Finally, I would like to thank the guys at our development department for their priceless help in creating this system. You’re the best!

Thanks for reading!

**Vitaliy Kotov, automation QA engineer**
