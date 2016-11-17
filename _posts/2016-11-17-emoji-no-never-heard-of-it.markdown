---
layout: post
title:  Emoji?! No, never heard of it
author: Artem Kunets
date:   2016-11-17
categories: Web-development, Javascript
excerpt: Emoji have been part of our life for some time now. But sending and displaying emoji is not a simple matter for a cross-platform application. The problem is that emoji sent from mobile applications are not always displayed correctly on the web.
---
<img class="no-box-shadow" src="{{page.imgdir}}/1.png" style="float:right; width: 50%; margin-left: 10px;"/>

Emoji have been part of our life for some time now. We use them on social media, especially in all kinds of messenger apps, where we can express our feelings in just one icon.

But sending and displaying emoji is not a simple matter for a cross-platform application. The problem is that emoji sent from mobile applications are not always displayed correctly on the web.

The latest releases of iOS and Android can support more than 1,200 emoji symbols, but the "desktop" market cannot match this range. We would like to achieve this, however, and are doing everything we can to enable our users to communicate easily on all platforms, without any restrictions on their conversations.
Let me explain how we have achieved 100% support for emoji on the web.

This is how a Windows user would see a message in his or her browser without emoji:

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

The basic idea is that we take any emoji, determine its Unicode code and convert it to an html element which will be displayed correctly in the browser.

## The theory

Let us consider 😀 (smiley face). It has the code **U+1F600**, and so this is how we retrieve this code using JavaScript:

{% highlight javascript %}
'😀'.length // 2
'😀'.charCodeAt(0).toString(16) // **D83D**
'😀'.charCodeAt(1).toString(16) // **DE00**
{% endhighlight %}

Altogether we obtain the surrogate pair: **U+D83D U+DE00.**

UTF-16 encodes the symbols as a sequence of 16-bit words, allowing the symbols to be written in Unicode in the ranges from U+0000 to U+D7FF and from U+E000 to U+10FFFF (a total number of 1,112,064 codes).

If you need to represent a symbol in UTF-16 which has a code greater than U+FFFF, you have to use two words:

- The first part of the surrogate pair (in the range from 0xD800 to 0xDBFF)
- And the second (in the range from 0xDC00 to 0xDFFF).

The following formula is used to obtain the code for an emoji found in the range above U+FFFF:

{% highlight javascript %}

(0xD83D - 0xD800) * 0x400 + 0xDE00 - 0xDC00 + 0x10000 = 1f600

{% endhighlight %}

And now to translate back:

{% highlight javascript %}

D83D = ((0x1f600 - 0x10000) >> 10) + 0xD800;
DE00 = ((0x1f600 - 0x10000) % 0x400) + 0xDC00;

{% endhighlight %}

This is quite complex and inconvenient. Let’s see what **ES 2015** can offer us.

With the new JavaScript standard we can forget about surrogate pairs and make our lives easier:

{% highlight javascript %}

String.prototype.codePointAt // return codePoint from String
String.fromCodePoint // return String from codePoint

{% endhighlight %}

Both methods work correctly with surrogate pairs. It’s still possible to insert eight-digit codes into a string:

**\u{1F466}** instead of **\uD83D\uDC66**

**RegExp.prototype.unicode**: the **u** flag in regular expressions provides the best support when working with Unicode:

{% highlight javascript %}

/\u{1F466}/u

{% endhighlight %}

Currently, Unicode standard 8.0 contains 1,281 emoji symbols, and this doesn’t include modifiers for skin colour and groups (emoji families). Major companies have their own implementation:

<img class="no-box-shadow" src="{{page.imgdir}}/7.png"/>

Emoji can be divided into several groups:

- Simple: in the range up to 0xD7FF — ⛄️ ;
- Surrogate pairs: from 0xD800 to 0xDFFF — 😀 ;
- Numbers: from 0x0023 to 0x0039 + 0x20E3 — 🔟 ;
- National flags: 2 characters from 0xDDE6 to 0xDDFF, resulting in — 🇷🇺 ;
- Skin colour modifiers: 👱 + from 0xDFFB to 0xDFFF —  👦🏿 ;
- Family: sequence from  👱 👱 👩    combined 0x200D or 0x200C — 👪

## Our solution

1. We receive a source text with symbols, and search it for all emoji collections with the help of a regular expression;
2. We determine the code for the character by using the codePointAt function;
3. We compose an img element (important that it has the tag img) with a URL which consists of the code for this symbol;
4. We replace the symbol with the img in the original text.

{% highlight javascript %}

function emojiToHtml(str) {
     	str = str.replace(/\uFE0F/g, '');
     	return str.replace(emojiRegex, buildImgFromEmoji);
}

var tpl = '<img class="emoji emoji--{code} js-smile-insert" src="{src}" srcset="{src} 1x, {src_x2} 2x" unselectable="on">';
var url = 'https://badoocdn.com/big/chat/emoji/{code}.png';
var url2 = 'https://badoocdn.com/big/chat/emoji@x2/{code}.png';

function buildImgFromEmoji(emoji) {
     	var codePoint = extractEmojiToCodePoint(emoji);
     	return $tpl(tpl, {
              	code: codePoint,
              	src: $tpl(url, {
                       	code: codePoint
              	}),
              	src_x2: $tpl(url2, {
                       	code: codePoint
              	})
     	});
}

function extractEmojiToCodePoint(emoji) {
     	return emoji
              	.split('')
              	.map(function (symbol, index) {
                       	return emoji.codePointAt(index).toString(16);
              	})
              	.filter(function (codePoint) {
                       	return !isSurrogatePair(codePoint);
              	}, this)
              	.join('-');
}

function isSurrogatePair(codePoint) {
     	codePoint = parseInt(codePoint, 16);
     	return codePoint >= 0xD800 && codePoint <= 0xDFFF;
}

{% endhighlight %}


The basic concept for the regular expression which finds emoji symbols:

{% highlight javascript %}

var emojiRanges = [
     	'(?:\uD83C[\uDDE6-\uDDFF]){2}', // flags
     	'[\u0023-\u0039]\u20E3', // numbers

'(?:[\uD83D\uD83C\uD83E][\uDC00-\uDFFF]|[\u270A-\u270D\u261D\u26F9])\uD83C[\uDFFB-\uDFFF]', // skin
     	'\uD83D[\uDC68\uDC69][\u200D\u200C].+?\uD83D[\uDC66-\uDC69](?![\u200D\u200C])', // joiners
     	'[\uD83D\uD83C\uD83E][\uDC00-\uDFFF]', // surrogate pair

'[\u3297\u3299\u303D\u2B50\u2B55\u2B1B\u27BF\u27A1\u24C2\u25B6\u25C0\u2600\u2705\u21AA\u21A9]', // simple

'[\u203C\u2049\u2122\u2328\u2601\u260E\u261d\u2620\u2626\u262A\u2638\u2639\u263a\u267B\u267F\u2702\u2708]',
     	'[\u2194-\u2199]',
     	'[\u2B05-\u2B07]',
     	'[\u2934-\u2935]',
     	'[\u2795-\u2797]',
     	'[\u2709-\u2764]',
     	'[\u2622-\u2623]',
     	'[\u262E-\u262F]',
     	'[\u231A-\u231B]',
     	'[\u23E9-\u23EF]',
     	'[\u23F0-\u23F4]',
     	'[\u23F8-\u23FA]',
     	'[\u25AA-\u25AB]',
     	'[\u25FB-\u25FE]',
     	'[\u2602-\u2618]',
     	'[\u2648-\u2653]',
     	'[\u2660-\u2668]',
     	'[\u26A0-\u26FA]',
     	'[\u2692-\u269C]'
];
var emojiRegex = new RegExp(emojiRanges.join('|'), 'g');

{% endhighlight %}

## Chat

Below you will see how we were able to construct a chat prototype with support for emoji.
<br/>A ```<div/>``` is used as the field for entering the message:

{% highlight html %}

<div id="t" contenteditable="true" data-placeholder="Введите сообщение"></div>

{% endhighlight %}


We strip possible HTML tags from its content when entering the message or inserting it from the clipboard:

{% highlight javascript %}

var tagRegex = /<[^>]+>/gim;
var styleTagRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gim;
var validTagsRegex = /<br[\s/]*>|<img\s+class="emoji\semoji[-\w\s]+"\s+((src|srcset|unselectable)="[^"]*"\s*)+>/i;

function cleanUp(text) {
     	return text
              	.replace(styleTagRegex, '')
              	.replace(tagRegex, function (tag) {
                       	return tag.match(validTagsRegex) ? tag : '';
              	})
              	.replace(/\n/g, '');
}

{% endhighlight %}

We use the paste event for processing a string inserted from the clipboard:

{% highlight javascript %}

function onPaste(e) {
     	e.preventDefault();
     	var clp = e.clipboardData;

     	if (clp !== undefined || window.clipboardData !== undefined) {
              	var text;

              	if (clp !== undefined) {
                       	text = clp.getData('text/html') || clp.getData('text/plain') || '';
              	} else {
                       	text = window.clipboardData.getData('text') || '';
              	}

              	if (text) {
                       	text = cleanUp(text);
                       	text = emojiToHtml(text);
                       	var el = document.createElement('span');
                       	el.innerHTML = text;
                       	el.innerHTML = el.innerHTML.replace(/\n/g, '');
                       	t.appendChild(el);
                       	restore();
              	}
     	}
}

{% endhighlight %}

Then we replace all the emoji found with the HTML tag img, as shown above. We need to use img, as ContentEditable works better with this. Bugs may occur during editing with other elements.

After inserting img in the input field, it’s necessary to restore the position so that the user can continue composing the message. We use the **Selection** and **Range** JavaScript objects for this:

{% highlight JavaScript %}

function restore() {
     	var range = document.createRange();
     	range.selectNodeContents(t);
     	range.collapse(false);
     	var sel = window.getSelection();
     	sel.removeAllRanges();
     	sel.addRange(range);
}

{% endhighlight %}

Once the composition of the message is completed, we must run the reverse procedure. This means we convert the <img/> to a symbol for sending to the server using the **fromCodePoint** function:

{% highlight JavaScript %}

var htmlToEmojiRegex = /<img.*?class="emoji\semoji--(.+?)\sjs-smile-insert".*?>/gi;
function htmlToEmoji(html) {
     	return html.replace(htmlToEmojiRegex, function (imgTag, codesStr) {
              	var codesInt = codesStr.split('-').map(function (codePoint) {
                       	return parseInt(codePoint, 16);
              	});

              	var emoji = String.fromCodePoint.apply(null, codesInt);

              	return emoji.match(emojiRegex) ? emoji : '';
     	});
}

{% endhighlight %}

You can see an example of a Chat system here: <a href="https://jsfiddle.net/q9484hcc/" target="_blank">https://jsfiddle.net/q9484hcc/</a>

And this is how we’ve have developed support for emoji that allow our users to fully express their emotion and to communicate with each other without restriction.
If you have any suggestions or ideas to improve and change our methods, feel free to leave a comment below. I will be happy to look at them.

Useful links:

- <a href="http://emojipedia.org/" target="_blank">http://emojipedia.org/</a>
- <a href="http://getemoji.com/" target="_blank">http://getemoji.com/</a>
- <a href="https://github.com/mathiasbynens/String.fromCodePoint" target="_blank">Polyfill String.fromCodePoint</a>
- <a href="https://github.com/mathiasbynens/String.prototype.codePointAt" target="_blank">Polyfill String.prototype.codePointAt</a>

**Artem Kunets - Badoo Frontend developer**
