## Badoo Tech Blog

This is the source code for the Badoo Tech Blog. It is built using Jekyll.

***

### Getting Set Up

First fork the http://git.ukoffice/mobile/techblog repository on GitHub.

Then clone your fork of the project locally by running the following command with your GitHub username:
```sh
git clone git@git.ukoffice:<yourusername>/techblog.git techblog
```

Then move into the **techblog** directory and add the original repository as a remote:
```sh
cd techblog
git remote add upstream git@git.ukoffice:mobile/techblog.git
```

***

### Contributing a Post

First make sure there is a nice picture of you in the **/images/authors/** directory. If your name is "Joe Bloggs" then there should be a file called "joe-bloggs.jpeg". It **MUST** be a .jpeg file.

Assuming you want to write a new post with a title of "I am awesome", first make sure you are in branch **master** and have pulled from upstream, then create a new branch.
```sh
git checkout master
git pull upstream master
git checkout -b i-am-awesome
```

Create a file in **/_posts/** in the format: **2013-06-13-i-am-awesome.markdown**

At the top of the file you need to include a YAML front-matter block like this:
```
---
layout: post
title:  I Am Awesome
author: Joe Bloggs
date:   2013-06-27
categories: javascript performance
---
```
This post has two categories, **javascript** and **performance**. Categories must be lowercase and a single word. Categories can be whatever you want but try to avoid creating really obscure ones. A post must have at least one category.

The body of a post is written in standard Markdown with the exception of code blocks, which should be included like this:
```html
{% highlight java %}
public static String getName () {
    return "Bob";
}
{% endhighlight %}
```
You must specify the language, some examples are:
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

To run a local version of the blog you need to install Jekyll, which is a Ruby gem.

***

### Very Important!

Once a post has has gone live **DO NOT CHANGE THE TITLE OR DATE**. If you do the link will change and then the internets will have broken links and everyone will be sad.