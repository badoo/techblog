## Badoo Tech Blog

This is the source code for the Badoo Tech Blog, it is built using [Jekyll](http://jekyllrb.com/).

***

### Getting Set Up

First fork the [badoo/techblog](https://github.com/badoo/techblog) repository on GitHub.

Then clone your fork of the project locally by running the following command, with `<yourusername>` replaced with your GitHub username:
```sh
git clone git@github.com:<yourusername>/techblog.git techblog
```

Then move into the **techblog** directory and add the original repository as a remote:
```sh
cd techblog
git remote add upstream git@github.com:badoo/techblog.git
```

***

### Contributing a Post

#### Environment

The tech blog is built using [Jekyll](http://jekyllrb.com/). So you need to install the ruby gem if you don't have it in your computer:

```bash
gem install jekyll
```

Furthermore, we use [Less](http://lesscss.org/) preprocessor, so you will also need to install it. The easiest way:

```bash
npm install -g less
```

Then make sure there is a nice picture of you in the **images/authors/** directory. If your name is "Joe Bloggs" then there should be a file called "joe-bloggs.jpeg". It **MUST** be a 200x200px **.jpeg** file.

#### Your first post

Assuming you want to write a new post with a title of "I am awesome", first make sure you are in branch **master** and have pulled from upstream, then create a new branch.
```sh
git checkout master
git pull upstream master
git checkout -b i-am-awesome
```

Create a file in the **_posts** directory in the format: **2013-06-13-i-am-awesome.markdown**

At the top of the file you need to include a YAML front-matter block like this:
```
---
layout: post
title:  I Am Awesome
author: Joe Bloggs
date:   2013-06-27
categories: javascript css
---
```
This post has two categories, **javascript** and **css**. Categories must be lowercase and a single word. A post **MUST** have at least one category. Also please note that these are categories, not hash tags.

So the rules for making new categories are as follows:
* If the category is of a major technology or language (e.g. php, css, java)
* If not then the category should have at least two articles written for it else it should go under miscellaneous


The body of a post is written in standard Markdown with the exception of code blocks, which should be included like this:
```html
{% highlight java %}
public static String getName () {
    return "Bob";
}
{% endhighlight %}
```
You must specify the language, any of the following are valid:
* javascript
* java
* html
* css
* obj-c
* sh (Bash scripts or terminal commands)


When you are done and have committed all your work, push your branch to your forked repository.
```sh
git push origin i-am-awesome
```

Submit a pull request back to the origin repository and someone (or lots of people) will review it and maybe make some comments. When everybody is happy your pull request will be merged and will be live on the site when the next release is done.

***

### Running Locally

To run a local version of the blog you need to install Jekyll, which is a Ruby gem. If you are running Windows see this [blog post](http://www.madhur.co.in/blog/2011/09/01/runningjekyllwindows.html) for instructions on how to set it up.

If you are on Mac OSX then run the following command. It will take a few minutes to install.
```sh
gem install jekyll
```

Then from the root of the **techblog** directory run:
```sh
jekyll serve --watch
```
Now go to **http://localhost:4000** in your browser. The `--watch` flag means that Jekyll will rebuild the project when you make a change to any file.


***

### Post Titles and Dates - Very Important!

Once a post has has gone live **DO NOT CHANGE THE TITLE OR DATE**. If you do the link will change and then the internets will have broken links and everyone will be sad.
