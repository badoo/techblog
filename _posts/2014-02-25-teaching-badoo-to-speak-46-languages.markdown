---
layout: post
title:  Localising into 46 languages
author: Dmitri Grabov
date:   2014-02-25
categories: miscellaneous
---
Localisation done right will earn your app loyal users in new countries. Done badly, it becomes a nagging pain like half the apps on my computer trying to correct the spelling of **localisation** to **localization**. The purpose of localisation is not only to make your app available in other languages, but also to make the entire user experience feel like it was specifically designed with the local user in mind. Here I will share some of the lessons learned from making Badoo available in 46 languages, and point out some of the tricky bits you should pay attention to.

## A brief intro
The process of making your service available in other languages consists of two parts, internationalisation and localisation.

Broadly speaking internationalisation, aka i18n, is the part where you take out all hard-coded strings from your code and replace them with reference keys. Once the strings have been translated, the reference keys will be used to fetch text in the requested language.

Localisation, aka l10n, is the part of actually adapting your content for different locales. The bulk of this will be translation, however you should also adapt non-text content for each market. For example in promotional pictures such as app store screenshots, use screenshots of the app in local language. Also, user names in screenshots should be names that will look familiar to people in the area, and people in photos should look like they are from that country or at least region.

That’s the theory. In practice the process is more complicated than that. Language translation aside, additional locale-specific conventions need to be adhered to your app to make sense and feel completely native to its users in other locales.

## Formats and units
There are some subtle but important differences in the formatting of dates and numbers that may have opposite meanings in different locales. A common example is dates.
>03/07/2013

The date above can mean 3rd July or 7th March depending on the local conventions. This is a frequent source of confusion between UK and US where, despite both speaking English, the date formats are different. Do not assume that because two countries speak the same language, all will be understood or correctly interpreted.

The same goes for number formats.
>1.000

The number above could be interpreted as either 1 or 1000 depending on which decimal point convention is used. For example, in Korea, a full stop (.) denotes a decimal sign, but in Germany a full stop is used as a thousands separator.

If you use any kind of measurements you will also need to ensure you use units that are easily understood in the region you are targeting. For example you will probably want to use miles rather than kilometres to denote distances in the United States as they use the Imperial system. Also, if you are displaying a temperature to a user in continental Europe you should use Celsius, as Fahrenheit is unlikely to be understood.

## Direction
While most languages are written from left to right, there are some notable exceptions such as Arabic and Hebrew that are written from right to left. Localising into these languages requires considerably more work than just translating. In most cases, the user interface is likely to be language direction specific and will require reworking to ensure your app retains its usability when direction is reversed.

## Gender specific grammar and pluralisation
English is in some ways a simple language. It has no gender-specific grammatical rules and in most cases all you need to do to create a plural of a noun is stick an ‘s’ on the end. Other languages can be more complicated - often the endings of words will change depending on whether the actor in the sentence is male or female.

In some languages the plural form rules can be quite complex. For example, in Russian a different form may be used depending on the exact number of the objects being counted. If there are between 2 and 4 objects, one form of plural is used, while if there are more another is used. However, if the number ends with a 1, then the singular form is used, unless it also ends with 11 in which case the first form of plural is used. Like I said, complex.

## Tone, context and string length
In most cases where strings are translated as short snippets, there is a lot of interpretation that can be applied to each translation. Words rarely have exactly the same meaning when translated into other languages and can have additional connotations. A lot of the time you will use language in your app that conveys your app’s personality and will want to preserve that tone in all languages.

An important catch to look out for is re-using the same string in different places. The problem you may run into there is that the wording may be the same in English for both cases, but other languages may require different phrasing due to the variation in context.

Working on mobile projects you will need to pay extra attention to string length. Screen space will be at a premium and you will need to ensure your text snippet can fit into the space allocated. In many languages, especially for some technical terms, you may not have a convenient direct translation and what may be a short word in one language can end up being a full sentence in another.

## Our solution
At Badoo we have an in-house localisation team, with translators for all our top markets based in the office full-time. Our team members translate and test content, and also work closely with developers to continuously improve our in-house translation system, and address language-related issues.

![Dashboard]({{page.imgdir}}/localisation-dashboard.png)

The screen above is the main client side interface our developers use when adding a new string to the localisation system. The very first text input contains the key we use to look up the snippet. As you can see we try to keep the key names as descriptive as possible. It should be fairly obvious from the key name what it is and where it is used.

To get around gender-specific grammar rules in different languages we use different keys for references to male and female people. While the original strings will be exactly the same when in English, in many languages there will be differences and this is the easiest way to take them into account. The translated text snippet is a simple template that can accept parameters as inputs. For example this could be the name of the person referred to in the string. To give the translators some additional context we also include a screenshot of the screen where the translated strings will be inserted.

As a precaution to prevent truncation and to ensure that the translated text will be displayed within the allocated space we also specify a maximum length for the string. The translated text in the app is manually checked to ensure it fits well and works in the context. Where it’s not possible to create sensible translation within the limit, a layout adjustment may be required. To avoid problems for smaller screen sizes, we mostly test translations on small-screen ldpi devices/emulators.

We generate unique language files for each app and platform on our network. To keep the size of these to a minimum you can specify which app/platform files need to have the particular key included.

As a final step, translation managers kick off a build and deploy a new version of the app to the test devices so that devs, testers and translators can see the latest version in action. For formats, units and number-dependent pluralisation, our solutions are server based.

To recap on the main points:
- Start by extracting all strings from your app
- Pay attention to number formats, units and plural forms in your translation
- Not all languages are read from left to right
- Remember that the translation may vary depending on the gender of the person in the text
- Make sure translated strings fit the context such as tone and space available


Finally, the purpose of localisation is to make all users feel like first class citizens in your app irrespective of their language and location. Often, that requires taking extra steps that may not be immediately obvious, but we can say from 7 years of experience that it’s well worth the effort.
