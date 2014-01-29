---
layout: post
title:  Localising into 46 languages
author: Dmitri Grabov
date:   2014-01-29
categories: localisation
---
Localisation done right will earn your app loyal users in new countries. Done badly, it becomes a nagging pain like half the apps on my computer trying to correct the spelling of **localisation** to **localization**. The purpose of localisation is not only to make your app available in other languages, but also make the entire user experience feel like it was specifically designed 

Here I will share some of the lessons learned from making Badoo available in 46 languages and point out some of tricky bits you should pay attention to.

## A brief intro
The process of making your service available in other languages consists of two parts, **internationalisation** and **localisation**.

Broadly speaking, internationalisation aka i18n is the part where you take out all hard coded strings from your code and replace them with reference keys. Once the strings have been translated, the reference keys will be used to fetch text in the requested language.

Localisation aka l10n is the part of actually adapting your content for different locales. The bulk of this will be translation, however you should also adapt non-text content for each market as well. For example, use screen shots of the app in local language, if screen shots feature names then it should be names that will look familiar to people in the area. In addition, people in photos should look like they are from that country or at least region.

That’s the theory, in practice the process is more complicated than that. Language translation aside, additional locale specific conventions need to be adhered to for your app to make sense and feel completely native to its users in other locales.

## Formats and units
There are some subtle but important differences in the formatting of dates and numbers which may have opposite meanings in different locales.

> 03/07/2013

What date is represented above? The answer will depend on what format you believe the date to be in. If you are in the USA, you will assume it is 7th March, 2013. If you are in UK you will expect it to be 3rd July, 2013. That is because the usual date format in US is mm/dd/yyyy and dd/mm/yyyy in the UK. Do not assume that because two countries speak the same language that all will be understood or correctly interpreted.

The same goes for number formats. What is number below?

> 1.000

If you are in Korea, you will expect the number to be 1. If you are in Germany then you would expect it to be 1000. That is because in Korea, a full stop (.) denotes a decimal sign, in Germany however a full stop is used a thousands separator and a comma is instead used as a decimal sign.

If you use any kind of measurements you will also need to ensure you use units that are easily understood in the region you are targeting. For example you will probably want to use miles rather than kilometers to denote distances in the United States as they use the Imperial system. Also, if you were displaying a temperature to a user in continental Europe you should use Celsius, Fahrenheit is unlikely to be understood.

## Direction
While most languages are written from left to right, there are some notable exceptions such as Arabic and Hebrew that are written from right to left. Localising into these languages requires considerably more work than just translating. In most cases, the user interface is likely to be language direction specific and will require considerable reworking to ensure your app retains its usability when direction is reversed.

## Gender specific grammar and pluralisation
English is in some ways a simple language, it has no gender specific grammatical rules and in most cases all you need to do to create a plural of a noun is stick an ‘s’ on the end. Other languages can be more complicated, often the endings of words will change depending on whether the actor in the sentence is male or female.

In some languages the plural form rules can be quite complex. For example, in some languages like Russian a different form may be used depending on the exact number of the objects being counted. If there is between 2 and 4 objects, one form of plural is used, if there is more another is used. However, if the number ends with a 1, then the singular form is used, unless it also ends with 11 in which case the first form of plural is used. Like I said, complex.

## Tone, context and string length
In most cases strings are translated as short snippets, there is a lot of interpretation that can to be applied to each translation. Words rarely have exactly the same meaning when translated into other languages and can have additional connotations. A lot of the time you will use language in your app that conveys your app’s personality and will want to preserve that tone in all languages.

An important catch to lookout for is re-using the same string in different places. The problem you may run into there is that the wording may be the same in English for both cases, but other languages may require different phrasing due to the variation in context. 

Working on mobile projects you will need to pay extra attention to string length. Screen space will be at a premium and you will need to ensure your text snippet can fit into the space allocated. In many languages, especially for some technical terms, you may not have a convenient direct translation and what may be a short word in one language can end up being a full sentence in another.

## Our solution
With all of the above considerations in mind we built our in-house system at Badoo. You can see the main screens of the app included below:

![Dashboard]({{page.imgdir}}/localisation-dashboard.png)

The screen above is the main interface our developers use when adding a new string the localisation system. The very first text input contains the key we use to look up the snippet. As you can see we try to keep the key names as descriptive as possible. It should be fairly obvious from the key name what it is and where it is used. 

To get around gender specific grammar rules in different languages we use different keys for referrences to male and female people. While the original strings will be exactly the same when in English, in many languages there will differences and this is the easiest way to take them into account.

The translated text snippet is a simple template that can accept parameters as inputs. For example this could be the name of the person referred to in the string. To give the translators some additional context we also include a screenshot of the screen where the translated strings will be inserted.

To ensure that the translated text will be displayed within the allocated space we also specify a maximum length for the string. Where it’s not possible to create sensible translation within the limit, a layout adjustment may be required. To avoid problems stemming from smaller screen sizes, we mostly test translations on small-screen ldpi devices / emulators.

We generate unique language files for each app and platform on our network. To keep the size of these to a minimum you can specify which app/platform files need to have the particular key included.

As a final step when a translator contributes a newly translated string, we automatically kick off a build  and deploy a new version of the app to the test devices so that devs, testers and translators can see the latest version in action.

To recap on the main points

- Start by extracting all strings from your app
- Pay attention to number formats, units and plural forms in your translation
- Not all languages are read from left to right
- Remember that the translation may vary depending on the gender of the person in the text
- Make sure translated strings fit the context such as tone and space available

Finally, the purpose of localisation is to make all users feel like first class citizens in your app irrespective of their language and location. Often, that requires taking extra steps that may not be immediately obvious. For example, we recently re-designed our app store promo screens to add local faces and names apart from translating texts.
