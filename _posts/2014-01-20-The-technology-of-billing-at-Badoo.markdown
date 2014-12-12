---
layout: post
title:  The technology of billing - how we do it at Badoo
author: Anatoly Panov
date:   2014-01-20
categories: miscellaneous
---

There are many ways to monetize your project, but all of them have one thing in common – the transfer of money from the user to a company account. In this article we will discuss how this process works at Badoo.

## What do we mean by ‘billing’?
Billing for us concerns all things related to the transfer of money. For example: pricing, payment pages and payment processing, the rendering of services and promo campaigns as well as the monitoring all of these things.

In the beginning, as with most startups, we had no paid services at all. The first steps towards monetization took place in 2008 (well after the official site launch in 2006.) We selected France as our guinea-pig and the only available payment method at that time worked via SMS. For payment processing we used a file system. Each incoming request was put into a file and moved between directories by bash-scripts, meaning its status changed during processing. A database was used only for registering successful transactions. This worked pretty well for us, but after a year this system became difficult to maintain and we decided to switch to using just a database.

This new system had to be re-worked quickly, as up till then we had been accepting payments in only a limited number of countries. But this system had one weak point – it was designed solely for SMS payments. To this day we still have some odd leftovers of this system in our database structure, such as fields MSISDN (mobile phone number) and short code (short number for premium SMS) in a table of successfully processed payments.

Now we receive payments from countries all over the world. At any given second at least a few users are trying to buy something on Badoo or through our mobile applications. Their locations are represented in this “Earth at Night” visual:

![Earth]({{page.imgdir}}/earthnight.png)

We accept payments using more than 50 payment methods. The most popular are credit card, SMS and direct billing, and purchases via the Apple Store and Google Play.

![Pay]({{page.imgdir}}/paychart.png)

Among them you can find such leftfield payment options as IP-billing (direct payments from your internet provider account), landline payments (you have to call from your landline and confirm payment). Once we even received a payment via regular mail!

![Letter]({{page.imgdir}}/letter.jpg)

## Credit card and bank payments
All payment systems have an API and work by accepting payments from their users. Such direct integrations work well if you have only a few of them and everything runs smoothly. But if you work with local payment systems it starts to become a problem. It is becoming harder and harder to support a lot of different APIs for several reasons: local laws and regulations are different, a popular local payment system provider may refuse to work with foreign clients, even signing a contract can draw out the process substantially. Despite the complexity of local payment methods though, adopting many of them has proven to be quite a profitable decision. An example of this is the Netherlands, which had not previously been a strong market for us. After we enabled a local payment system named iDeal, however, we started to take in 30-40% more profit.

Where there is demand, usually there’s someone ready to meet it. Many companies known as ‘payment gateways’ work as aggregators and unify popular payment systems – including country-specific ones – under one single API. Via such companies, it suffices to perform an integration only once and after that one gets access to many different payment system around the world. Some of them even provide a fully customizable payment page where you can upload your own CSS & JS files, change images, texts and translations. You can make this page look like part of your site and even register it in a subdomain such as "payments.example.com". Even tech-savvy users might not understand that they just made a payment on a third-party site.

Which is better to use? Direct integration or payment gateways? First of all it depends on the specific requirements of the business. In our company we use both types, because we want to work with many different payment gateways and sometimes make direct integrations with payment systems. Another important factor in making this decision is the quality of service provided by a payment system. Often payment gateways offer more convenient APIs, plus more stable and higher-quality service than source payment system.

## SMS payments
SMS payments are very different to other systems. In many countries they are under very strict control, especially in Europe. Local regulators or governments can make demands regarding all aspects of SMS payments. For example specifying the exact text sent via SMS or the appearance of the payment page. You have to monitor changes and apply them in time. Sometimes requirements can seem very strange, for example in Belgium you must show short code white on black with price nearby. You can see how this looks on our site below.

![SMS]({{page.imgdir}}/buycredits.png)

Also there are different types of SMS-billing: MO (Mobile Originated) and MT (Mobile Terminated). MO-billing is very easy to understand and implement. As soon as a user sends an SMS to our short number we receive money. MT is a bit more complicated. The main difference is that a user’s funds are not deducted from the moment he or she sends the SMS, but when a message from us is recieved with a notification that he or she is being charged. Through this method, we get the money only after receiving delivery notification of this payment message.

The main goal of MT-billing is to add an additional check on our side before the user sends money, preventing errors that occur due to user-misspelled SMS texts. Using this method, the payment process consist of two phases. First, the user initiates payment and second, they receive confirmation. In some countries the payment process for MT-billing follows one of these variants:

- the user sends an SMS on short number, we receive it and check that the text is correct, etc. We send a free message with custom text, which the user has to answer, confirming the payment. After that we send a message that they have been charged
- same as above, but instead of responding directly to the free message the user has to enter a PIN code from it on the Badoo site
- the user enters their phone number on Badoo, we send a free message with a PIN. The user then enters the PIN code on Badoo, and after checking this, we send the payment message

For SMS payments we use only aggregators. Direct integrations with operators are not profitable, because you have to support a lot of contracts in many countries, which increasingly requires the involvement of accountants and lawyers.

## Technical details
Badoo works on PHP and MySql. For payment processing we also use the same technologies. However billing application works on separate pools of servers. These are divided into groups, such as servers to process income requests (payment pages, notification from aggregators, etc), servers for background scripts, database servers and special groups with increased security where we process credit cards payments. For card payments, servers must be compliant with PCI DSS. Its security standards were developed in coordination with Visa, Master Card, American Express, JCB and Discover for companies who process or store the personal information of their cardholders. The list of requirements which have to be met to use these systems is quite long.

As database servers we use two MySql Percona servers, working in master-master replication. All requests process via only one of them - the second is used for hot-backup and other infrastructure duties, such as heavy analytical queries, monitoring queries and so forth.

The whole billing system can be divided into few big parts:

- **Core** - the base entities needed for payment processing such as Order, Payment and Subscription
- **Provider plugins** - all provider-related functionality such as implementation of API and internal interfaces
- **Payment page** - where you can choose a product and payment method

In order to integrate a new payment provider, we need to create a new plugin which is responsible for all communication between us and the payment gateway. These can be of two types, depending whether we initiate the request (pull requests) or the payment provider initiates it (push requests). The most popular protocol for pull-requests is HTTP, either in itself or as transport for JSON/XML. The REST API (which has gained a certain degree of popularity recently) we haven’t encountered very often. Only new companies or companies who reworked their API recently offer it. For example with the new PayPal API or the new payment system used by the UK’s GoCardless company. The second most popular transport for pull requests is SOAP. For push requests mostly HTTP is used (either pure or as transport), and SOAP only rarely. The only company that comes readily to mind that offers SOAP push notifications is the Russian payment system QIWI.

After the programming part is finished the testing process begins. We test everything several times in different environments: the test environment, in shot (internal domain with only one particular task and working production environment), in build (pre-production version of code which is ready to go to live) and in the live environment. For more details about release management at Badoo please visit our blog: ([http://techblog.badoo.com/blog/2013/10/16/aida-badoos-journey-into-continuous-integration/](http://techblog.badoo.com/blog/2013/10/16/aida-badoos-journey-into-continuous-integration/)).

For billing tasks there are some peculiarities. We have to test not only our own code but how it interacts with third party systems. It's nice if the payment provider offers their own sandbox which works the same as our production system, but if not we create stubs for them. These stubs emulate a real aggregator system and allow us to do manual and automatic testing. This is an example of a stub for one of our SMS providers.

![Letter]({{page.imgdir}}/credittest.png)

After passing through the test environment we check how it will work with the real system, i.e. making real payments. For SMS payments, we often need to get approval from local regulators, which can take a few months. We don't want to deploy semi-ready code on production so as a solution we create a new type of environment external shot. This is our regular shot, a feature branch with one task, but accessible by external sub-domain. For security reasons we create them only if needed. We send links to external shots to our partners and they can test changes at any time. It's especially convenient when you work with partners from another hemisphere where the time difference can be up to 12 hours!

## Support and operation
After a new integration goes live we enter the stage of its support and operation. Technical support occupies about 60-70% of our work time.

![Support]({{page.imgdir}}/supportchart.png)

By support I mean primarily customer support. All easy cases are solved by the first line of support. Our employees know many different languages and can translate and attend to customer complaints quickly. So only very complicated cases end up on the desks of our team of developers.

The second component of support is bug fixing or making changes to current integrations. Bugs appear due to multiple reasons. Of course the majority are a result of human error, i.e. when something is implemented in the wrong way. But sometimes it can result from unclear documentation. For example, once we had to use a Skype chat with a developer of a new payment system instead of documentation. At other times a payment provider makes changes on their side and forgets to notify us. One more point of failure is third party systems, as a payment provider’s aggregate payment services error can occur not on their side, but on their partner’s side.

In order to solve such cases quickly we maintain detailed logs. These contain all communications between us and payment providers, all important events, errors during query processing and so on. Each query has its own unique identifier through which we can find all rows in logs and reconstruct the steps of an execution query. It’s especially helpful when we have to investigate cases that happened a few weeks or months ago.

So that’s how billing is organized at Badoo! There are still many interesting topics we plan to explore in future, such as monitoring, PCI DSS certification, and re-working bank-card payments. If you have questions or suggestions for future articles, please leave a comment for us below.