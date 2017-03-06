---
layout: post
title: How to teach a web app to speak 100 languages - the specifics of localisation
author: Vyacheslav Volkov
date:   2017-02-23
categories: Web-development JavaScript
excerpt: A key characteristic of online services these days is that they are accessed by users from all over the world speaking a multitude of languages. If you are developing this kind of service and want people worldwide to be able to use it then you’ll need your product translated and adapted - in other words, your product should be localised.
---
<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

A key characteristic of online services these days is that they are accessed by users from all over the world speaking a multitude of languages. If you are developing this kind of service and want people worldwide to be able to use it then you’ll need your product translated and adapted - in other words, your product should be localised.

The idea behind writing this article came up after the MoscowJS meetup, where I was giving a presentation about how the localisation process works at Badoo (it’s in Russian but feel free to take a look at my video presentation <a href="https://www.youtube.com/watch?v=gq4S7JLbbmM">here</a>). In this article, I’ll talk in more in depth about the specifics of localisation for web applications, what the solutions available for localisation are and why we’ve taken the approach that we use at Badoo. For all of you that are interested - welcome on board!

## Why localise?

If you are only aiming at the local market you will probably never require localisation, or rather localisation won’t be required until your product becomes of interest for an international audience. If this happens, you will  need to quickly adapt your application to a range of new culture-specific elements, which is not so easy. So, it’s worth making the decision now and asking yourself the question: do I need localisation? If the answer is yes, then your service needs to be prepared for the specifics that different languages will bring. The overall approach and tools which allow us to take these elements into consideration are called internationalisation, which is the process of creating an application capable of working in various languages with different regional specifics, and without any kind of additional changes.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

<br>

The next question you need to answer is this: why is localisation important? It is important primarily for users and clients, as each of them should feel comfortable when using your application. As an example, residents of any foreign country prefer to make purchases in their own language, even if they know English well. The majority also prefer to use support services in their mother tongue. If we take Europe as an example, which has around 50 countries, each  of them will have their own regional format for expressing numbers, dates and currency. And if we widen our audience to include the whole world, there are countries such as China, Iran, Afghanistan or Saudi Arabia where text is written from right to left or top to bottom, with numbers written using Arabic or Persian symbols.

## Special language features

So, which linguistic characteristics should you first pay attention to after deciding on localisation? It’s worth first of all taking a look at how times and dates are expressed in the relevant countries. Several differing date conventions are shown in the table below. As you will see, most countries use a different format.
<table>
  <tr>
    <th>Format</th>
    <th>Date example</th>
    <th>Country</th>
  </tr>
  <tr>
    <td>yyyy.mm.dd</td>
    <td>2016.09.22</td>
    <td>Hungary</td>
  </tr>
  <tr>
    <td>yyyy-mm-dd</td>
    <td>2016-09-22</td>
    <td>Poland, Switzerland, Lithuania, Canada</td>
  </tr>
  <tr>
    <td>yyyy/mm/dd</td>
    <td>2016/09/22</td>
    <td>Iran, Japan</td>
  </tr>
  <tr>
    <<td>dd.mm.yyyy</td>
    <td>22.09.2016</td>
    <td>Russian, Slovenia, Turkey, Ukraine</td>
  </tr>
  <tr>
    <td>mm/d/yyyy</td>
    <td>9/22/2016</td>
    <td>USA</td>
  </tr>
</table> <br>

The format for writing times also differs from country to country. For example, the US, Canada, Australia and New Zealand use a 12-hour time format based on the English system, while the rest of the world uses the 24-hour French system.

The next individual characteristics are formats for numbers and currencies. As can be seen in the table below, thousands and decimals can be divided by a point, a comma or a space. Also, the position of a currency symbol can differ not only in different languages, but in different countries as well. Germany and Austria speak the same language but use opposing formats for currencies.
<table>
  <tr>
    <th>Example</th>
    <th>Locale</th>
    <th>Country</th>
  </tr>
  <tr>
    <td>123 456,79 €</td>
    <td>ru-RU</td>
    <td>Russia</td>
  </tr>
  <tr>
    <td>€123,456.79</td>
    <td>en-US</td>
    <td>USA</td>
  </tr>
  <tr>
    <td>123.456,79 €</td>
    <td>de-DE</td>
    <td>Germany</td>
  </tr>
  <tr>
    <<td>€ 123 456,79</td>
    <td>de-AT</td>
    <td>Austria</td>
  </tr>
</table> <br>

Special consideration arise with the <a href="https://en.wikipedia.org/wiki/Chinese_numerals">numbering system</a> in China. In Chinese, numbers are grouped in a different way  than in Russian. We are used to grouping numbers in thousands, whereas the Chinese group them in tens of thousands. As an example, the number 150,000,000 would be written as 1亿5000万. In addition, Chinese people are very superstitious when it comes to numbers and have a serious and contemplative view of numerology. The number 4 sounds the same as the word for death, and so the Chinese strive to avoid it.  Many hotels have no rooms containing the number four and sometimes even contain no fourth floor. This also applies to  bank account numbers - the dream of many a Chinese person is to get an account number containing an eight, which is a symbol of wealth and prosperity.

Problems can also occur with the imperial system of measurement, which is still used in the USA, Myanmar and Liberia. And why is this important? We should take a moment to remember the <a href="https://en.wikipedia.org/wiki/Mars_Climate_Orbiter">Mars Climate Orbiter</a> which was sent to the red planet and crashed into the surface of Mars because the equipment team measured force in Newtons, while the software back on Earth measured forces in pounds. Nobody noticed the difference during the probe’s flight and the mistake cost 125 million dollars. So, the lesson is clear - don’t forget to show results in the way that is regarded as standard by your users.

As we’ve now deciphered the world of dates and numerals, we can move on to issues of translation. The most difficult problem in Russian is the declension of nouns after numbers. As you may know, Russian has three plural forms, while English only has two. Some languages can have up to 6 plural forms. You can find a table of forms for every language at this <a href="http://www.unicode.org/cldr/charts/29/supplemental/language_plural_rules.html">link</a>.

<br>

<table>
  <tr>
    <th>Russian</th>
    <th></th>
    <th>English</th>
  </tr>
  <tr>
    <td>У вас 1 подарок</td>
    <td>Singular</td>
    <td>You have 1 gift</td>
  </tr>
  <tr>
    <td>У вас 5 подарков</td>
    <td>Plural</td>
    <td>You have 5 gifts</td>
  </tr>
  <tr>
    <td>У вас 2 подарка</td>
    <td>Few</td>
    <td>You have 2 gifts</td>
  </tr>
</table>

We could dedicate a whole article to the specifics of translation. There are a wide range of linguistic characteristics to consider which we will list below. Let’s go to the first piece of advice.

**1.** Translate phrases and sentences in their entirety. Sentences should not be split up into words, as word order can vary in different languages.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

Let’s take the following sentence as an example: 8,283 out of 15,311 people liked you!
The English version will look like this:

{% highlight html %}

<b>{{num_voters_yes_maybe}}</b> out of <b>{{num_voters_total}}</b> {{people}} liked you!

{% endhighlight %}

Whereas the Japanese version will come out differently:

{% highlight html %}

<b>{{num_voters_total}}</b>{{people}}<b>中{{num_voters_yes_maybe}}</b>人があなたを気に入っています！

{% endhighlight %}

As can be seen in this example, the word order is reversed in Japanese. We can’t just write ‘Page ' + pageNum + ' from ' + total as many developers do.

<br>

**2.** Sometimes translation differs because of a person’s gender.

As you can see in the example below, while the same sentence can often apply to both male and female, in Slovak each gender requires its own separate phrase.

English

{% highlight html %}

You got an award on <span>{{award_date}}</span>

{% endhighlight %}

Slovak

{% highlight html %}

Мale: Toto ocenenie si získal <span>{{award_date}}</span>
Female: Toto ocenenie si získala <span>{{award_date}}</span>

{% endhighlight %} <br>

**3.** Translation of strings must depend on the context. The translator must know the meaning of the whole sentence, phrase or paragraph, otherwise he or she may not understand the idea correctly, resulting in an incorrect translation. A phrase such as *"You can save this {{item}}”* can have a different translation depending on whether “save” means “keep” or “rescue”. In an ideal situation, the translator is not only able to see the string for the translation but also a graphic of the area where the string will be shown.

<br>

**4.** Reusing translation resources may be unwise. As an example, “Save” (for a file) and “Save” (for settings) may require a different word in some languages. A word such as “thread” may have several different translations depending on whether it refers to a programming sequence or a strand of cotton.

We’ve now set out the most common characteristics that are met in localising a web application. This is still far from everything that localisation can encompass, as design characteristics can also be part of the procedure (considering that Japanese and Chinese require larger characters, and that in some languages the text length may be twice as long as in English); the colours used (red and green may have opposite meanings in some cultures, e.g. a red tick in Japanese means that you did something wrong), the images used (for example using Asians in pictures for the Asian market, Europeans for Europe) and many other aspects which are characteristic of specific countries and cultures.  All of this goes outside of the realms of this article, but is worth remembering.

Let’s take a look at the internet to find out which utilities are available for client localisation.

## Methods of client-side localisation

Developing interfaces and implementing complicated business logic already requires developers to solve many localisation problems client-side. The opportunities for internationalisation, which were available up until recently via ECMAScript, were fairly scant, and libraries such as Closure, Globalize, YUI, Moment.js as well as developers’ own custom solutions started to appear. These all broadened the opportunities of ECMAScript and filled in the gaps in internationalisation, but the solutions had different program interfaces and had some limitations, for example connected with comparing strings. In December 2012 the <a href="http://www.ecma-international.org/ecma-402/1.0/ECMA-402.pdf">ECMA-402</a> standard arrived, which should have made the lives of front end developers simpler when internationalising applications. But is this really what happened? Let’s take a look at what this standard now offers.

<br>

### ECMAScript Internationalisation API

This is a standard which features the ECMAScript programming interface for adaptation to linguistic and cultural characteristics for languages or countries. Work comes through the Intl object, which provides formatting for numbers (Intl.NumberFormat), dates (Intl.DateTimeFormat) and string comparison (Intl.Collator). At the present time <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl">it supports</a> all current browsers. The last browser to add support in recent times was Safari, although for outdated browsers a <a href="https://github.com/andyearnshaw/Intl.js/">polyfill</a> can be used.

The greatest advantage with this standard is that it was developed with support from Google, Microsoft, Mozilla and Amazon, and, <a href="http://wiki.ecmascript.org/doku.php?id=globalization:strawman">as we have been promised</a>, it will continue to be developed. Options for string formatting will be added including multiple number and field forms, number parsing and much more. It’s a shame that all this has happened fairly slowly. The standard itself was confirmed in 2013 but unfortunately support from the most popular browsers only appeared in 2016. The Intl functional object is fairly limited for now and does not provide possibilities for translation. This means that either a client solution or a polyfill must be used for any format that has not  yet to been accepted.
<table>
  <tr>
    <th>ADVANTAGES</th>
    <th>DISADVANTAGES</th>
  </tr>
  <tr>
    <td>
    ● Native browser implementation; <br>
    ● High productivity; <br>
    ● Does not require download of additional resources; <br>
    ●  String formatting for different locales without uploading JavaScript resources; <br>
    ● Development of the ECMAScript 2017 Internationalisation API
    </td>
    <td>
    ● Need to add polyfill for outdated browsers; <br>
    ● Dependence on the system -some locales may not be supported by the client; <br>
    ● Results may vary in different browsers.
    </td>
  </tr>
</table>

ECMAScript Internationalisation API examples

{% highlight html %}

var mFormat = new Intl.NumberFormat("ru", {
 style: "currency",
 currency: "GBP"
}).format(1234567.93);
console.log(mFormat); // 1 234 567,93 £

var nFormat = new Intl.NumberFormat('ru-RU').format(1000.15);
console.log(nFormat); // "1 000,15"

var utc = new Intl.DateTimeFormat("en-US", {
 timeZone: "utc",
 hour: "numeric",
 minute: "numeric"
});
console.log(utc.format(new Date())); // 2:38 PM

{% endhighlight %}

You can find a few more examples <a href="https://jsfiddle.net/5jusjhf2/2/">here</a>.

As you may notice, there is a lot still to be implemented into this standard, taking into consideration all the characteristics that web developers face. As I mentioned earlier, you will either have to weigh up the current solutions or develop your own. At the present time, there are a rather large number of solutions, each with their strengths and weaknesses. Taking a look through Google, some of the first results are <a href="http://i18next.com/">i18next</a>, <a href="https://formatjs.io/">FormatJS</a>, <a href="https://github.com/globalizejs/globalize">Globalize</a>, <a href="https://github.com/wikimedia/jquery.i18n">jQuery.i18n</a> and others. Some of these libraries offer their own solutions, while others try to go with the ECMA-402 standard. Let’s take a look at two libraries which come up on the first page of Google’s search results and see what they can do.

<br>

### i18next

As the developer claims, this is a very popular library for internationalisation both server-side (node.js) and client-side. There are numerous plugins and utilities and the library can be integrated into different frameworks. It has an interface for translators which translated files can be loaded into, but unfortunately you need to pay for it. The library has a lot of capabilities and the library continues to be developed, which is promising. It does not conform to ECMA-402 certification and has its own structural format for messages instead of <a href="http://userguide.icu-project.org/formatparse/messages">ICU Message syntax</a>. In addition, formatting dates and numbers requires downloading <a href="http://momentjs.com/">moment.js</a> or <a href="http://numeraljs.com/">numeral.js</a>. You’ll have to download the corresponding libraries into the project and also add locales for the required languages.
<table>
  <tr>
    <th>ADVANTAGES</th>
    <th>DISADVANTAGES</th>
  </tr>
  <tr>
    <td>
    ● Support for many language characteristics. <br>
    ● Possibility to download resources from back-end. <br>
    ● Additional plugins and utilities. <br>
    ● Expansion for popular frameworks and templating engines. <br>
    </td>
    <td>
    ● Requires download of additional resources (i18next 35kb + moment 20kb + necessary locale). <br>
    ● Does not follow ECMA-402 standard. <br>
    ● Paid interface for translators.
    </td>
  </tr>
</table>

You can find more detailed information on working with the library and more examples on the <a href="http://i18next.com/translate/">official site</a>.

<br>

### Format JS

Format JS is a modular collection of JavaScript libraries for internationalisation. It is based on ECMA-402, ICU and CLDR standards and can be integrated with many frameworks and templating engines such as Dust, Ember and Handlebars. The given library either downloads a polyfill for internationalisation work as required, or uses browser capabilities. It also supports work client-side or server-side.

<table>
  <tr>
    <th>ADVANTAGES</th>
    <th>DISADVANTAGES</th>
  </tr>
  <tr>
    <td>
    ● Modularity. <br>
    ● Uses capabilities of ECMA-402 or polyfill. <br>
    ● Expansion for popular frameworks and templating engines.
    </td>
    <td>
    ● You need to download additional resources as required. <br>
    ● Does not offer all options for translations.
    </td>
  </tr>
</table>
To take an example, text for translation in the ICU format will have the following form:
<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>

You can check the code at this <a href="http://format-message.github.io/icu-message-format-for-translators/editor.html">link</a>. Use the above example and set the locale to “ru”. At first glance the format is pretty complicated, but it allows many linguistic characteristics to be considered. I haven’t previously seen convenient translation systems that operate with this kind of format.

As you can see, there is a wide range of solutions and all you have to do is choose one. The localisation process does not simply end with the choice of the localisation system but attempts to deal with different language characteristics. Any translation system must be closely integrated into your development process and present the same infrastructure for both developer and translator, providing answers to important questions such as:

- What will the translation process look like?
- How will the files for translations be sent to the translators and then be put back into the system?
- How will the translator know where specific text is located?

It is only when you have the answers to these questions that you will have a suitably integrated localisation system which is easy to use.

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>

We had to consider all of these questions and characteristics as Badoo went out into the international market. In those days, even if some localisation systems were available, they didn’t meet all of our requirements and we therefore had to develop our own system for localisation. The given system had to be well integrated into our general process, be transparent and not slow down the work process (so that we could create new releases twice a day - it’s very important for us that new product ideas can quickly go to production). In addition, we needed the option not only to work with the web but also with all our other platforms, such as iOS, Android, Windows Phone as well as to be suitable for mailouts.

The appearance of a general communication format between our clients and servers (protocol) or as we say in our company, “appification” means that more texts come from the server. This approach seemed convenient for us, as you don’t need to store a large volume of translations client-side which allows us to carry out AB-testing for lexemes or create lexemes which are dependent on user actions. Each client can also store the necessary translations. The decision on where to store the translations - either client-side or server-side, is taken by the team responsible for developer protocol. If any translations are updated, each client is able to request the new translations (as translations are updated often, and new releases appear in app stores with limited frequency). We call this mechanism Hot Lexeme update.

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>

As you can see from the picture above, the process of localisation not only requires client developers and translators, but many other teams as well. For example, the MAPI team design the protocol and make the decision on where the translations are to be stored. The BackOffice team provide a suitable interface for the translators, the translators do the translations, and the SRV (server developers) or Frontend (client developers) generate and render the translations. In addition, when we created the system, we were successful in creating a collaborative translation system (<a href="https://translate.badoo.com/">https://translate.badoo.com/</a>) which our users can get involved with. They really helped us out when it came to creating translations that were able to take account of the local characteristics of each country.

## Conclusion

The localisation process for any application is a serious and painstaking task involving different project teams, not just developers and translators. So, as we come to the end of this article I’d like to draw your attention to the following founding principals in localising an application:

1. Localisation is a pretty complex procedure when it comes to implementing “on top”. If you need localisation, it should be included in the project right from the very start.
2. Localisation resources must be independent from the application.
3. Localisation expands not only within strings, but also has to be considered in the overall design.
4. Make your system convenient not just for developers, but also for translators and automate the translation process.
5. If you’re not sure about the quality of a translation you’re better off not translating at all.
6. Make the effort to take the specifics of every language and country into account.
7. The design, layout, colour palette and images used must be subject to localisation.

That’s probably all from me on this topic. I hope you’ve managed to get a sense of some of the delicate issues involved in the localisation process. If you’d like to tell us about your own experience, share it with us in the comments section. Let’s make the web great again!

**Vyacheslav Volkov, Frontend Developer.**
