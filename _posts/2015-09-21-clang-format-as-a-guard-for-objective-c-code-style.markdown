---
layout: post
title:  clang-format as a guard for Objective-C code style
author: Vladimir Magaziy
date:   2015-09-21
categories: objective-c python
---


This article is about the experience of Badoo's iOS team in making sure Objective-C code is compliant with the code style used.


## Importance of the code style


The primary goal of all coding conventions is to unify code as much as possible and eliminate personality. It’s like handwriting, nobody cares about it until it has to be understood quickly by someone else, and it becomes a disaster. With that, it is important to realise that styling conventions are to be taken into account and followed with the only objective -- they allow us to simplify readability and further maintenance of source code, especially when dealing with code written by others or a long time ago. 


Every project made by a group of people faces the issues with code styles, and the iOS team at Badoo is no exception in this respect -- [Badoo Objective-C Style Guide](https://github.com/badoo/objective-c-style-guide) defines our coding conventions.


## Styling issues during code review


It’s important to follow defined conventions for all sources and every time, this is non-negotiable. But what guarantees they are followed? Code reading and code reviews, right?


It seems everyone can tell stories about times when his or her changes have been reworked because of a wrongly placed star, bracket or missed space. Great, but it’s just as easy to overlook such issues during the code reading as it is to make slips when writing. The worst part is that it requires additional attention to details from reviewers, and thus more important things (like the absence of an array boundary check) may not be noticed because of complaints about the position of brackets in the same area. Finally, it annoys developers when something has to be reworked because of a minor thing which does not affect the compiled code, as the next iteration will be delayed applying the changes, and reviewers distracted.


## Automation of checks and clang-format


Fortunately, it is possible to make such checks automatically using scripts or tools.


For instance, Google uses [a tool to assist with style guide compliance](https://github.com/google/styleguide/tree/gh-pages/cpplint), but it is tightly tailored to [Google coding conventions for C++](http://google.github.io/styleguide/cppguide.html). Other projects use similar tools, but they are often specific and cannot be configured.


[Uncrustify](http://uncrustify.sourceforge.net) is a much better option as it allows us to set up and configure lots of checks. However it doesn’t build a syntax tree, so it often mixes up syntax constructions and ends up with wrong corrections. It does not allow us to re-format code, so for instance when the name of function is changed it doesn’t take this into account for formatting of multi-line parameters. Finally, it doesn’t allow us to perform a check for particular lines of code, but for whole files only.


[clang-format](http://clang.llvm.org/docs/ClangFormat.html) does not have so many options, but it also doesn’t have the issues mentioned. It builds a syntax tree and it uses fancy [algorithms under the hood](http://llvm.org/devmtg/2013-04/#talk4) to resolve conflicts. It also exploits the capabilities of the same code parser as for creation of binaries, so it does not emit lots of false corrections.


We opted for the last variant and used **clang-format**:


- All our attempts to extend Google's **linter** with corresponding checks for Objective-C and adjust it to [Badoo coding conventions](https://github.com/badoo/objective-c-style-guide) did not lead to desirable results: lots of checks were still false and lots of statements were missed.
- Configuration of **Uncrustify** took lots of time (it has up to **300** options!), but it still had issues with interpretation of simple Objective-C constructions: for instance,  `id<MyDelegate> delegate` was misinterpreted with the compare operator.


## Setting up clang-format


Set-up of **clang-format** is done using configuration files, but different parts of the project located in different folders may have different configurations. This was not the case for Badoo, so the only configuration file was generated in the root of source tree -- it has to be named either *_clang-format* or *.clang-format*. **clang-format** has a set of predefined styles used in [the following projects](http://clang.llvm.org/docs/ClangFormatStyleOptions.html#configurable-format-style-options) LLVM, Google, Chromium, Mozilla, WebKit, and GNU (not documented), so since [Badoo's Objective-C conventions](https://github.com/badoo/objective-c-style-guide) are the closest to [WebKit ones](http://www.webkit.org/coding/coding-style.html), it looked like this:


<pre>
$ clang-format -style=WebKit -dump-config > .clang-format
</pre>


Once it was done, the generated configuration file was adjusted to [the conventions](https://github.com/badoo/objective-c-style-guide). This was pretty straightforward as the configuration file has a simple key-value [structure](http://clang.llvm.org/docs/ClangFormatStyleOptions.html).


## Starting point: reformatting all up


In order to avoid further complaints and unnecessary debate it has to check and reformat existing code using the new tool. This allows us to white out the existing sources and continue with formatted ones. In Badoo it was done using [a special Python script](https://github.com/badoo/objective-c-style-guide/blob/master/scripts/update_codestyle.py) which enumerates sources and skips auto-generated and third party ones, as well as fixing copyright headers. This script is also used when a new version of **clang-format** [is introduced](http://llvm.org/releases/download.html) to automatically re-format corresponding sources.


Another question is when it should be done. Certainly initial reformatting produces a lot of changes, and this leads to conflicts with existing ones in branches. Due to this, it was decided to apply reformatting when there are few active tasks and not much work in progress, and at Badoo it was decided to run it on Jan 1st (it was also symbolic -- the New Year is always associated with something new and surprising). In addition, it was a good marker that those changes are because of the style: from time to time it helps when checking changes with `git blame`. Also to avoid further complaints  it was authored by a special bot, so all blame is focused on it, not a real person in the team.


## Going forward: automatic reformatting and git hooks 


Having the **clang-format** configured may be the end of the story.


If Xcode is the only tool used for dealing with sources, [BBUncrustifyPlugin-Xcode](https://github.com/benoitsan/BBUncrustifyPlugin-Xcode) plug-in can radically simplify development as it reformats sources using **clang-format** according to the configuration once the file is saved, or it may reformat only selected files or lines of code.


If esoteric source code editors like [bbedit](http://www.barebones.com/products/bbedit/) are used instead, then [check out](https://github.com/llvm-mirror/clang/tree/master/tools/clang-format) available [extensions](http://clang.llvm.org/docs/ClangFormat.html#vim-integration).


So far so good, but these approaches do **NOT** guarantee the committed source code actually corresponds to the conventions. With that in mind, we decided to add a corresponding check to avoid accidental commits which contradict the conventions. Since Badoo uses **git** as [a revision control system](https://en.wikipedia.org/wiki/Revision_control), it was decided to add [a pre-commit hook](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks). This hook checks differences which are about to be committed against the conventions, and if it detects issues it complains and cancels the commit:


<pre>
$ git diff
diff --git a/main.m b/main.m
index 294a954..967a7ae 100644
--- a/main.m
+++ b/main.m
@@ -21,8 +21,8 @@ int main(int argc, char *argv[]) {
 #else
             isLoggingEnabled = NO;
 #endif
-            NSDictionary *dict = @{ @"isLoggingEnabled" : @(isLoggingEnabled) };
-            [[NSUserDefaults standardUserDefaults] registerDefaults:dict];
+            NSDictionary* configuration  = @{ @"isLoggingEnabled" : @(isLoggingEnabled) };
+            [[NSUserDefaults standardUserDefaults] registerDefaults: configuration];
 
         }
</pre>


And if some issues are detected during the commit they are shown as follows:


<pre>
$ git commit -a
ERROR: INCORRECT CODE STYLE
If you believe it is correct, use '-n' or '--no-verify' option to ignore this error.
Otherwise execute 'cat /var/folders/hs/p6xmm3hs3x51pzc2jd3__wrr0000gq/T/com.badoo.codestyle.4nvjrD.patch | patch -p0' to fix found issues.
Do NOT forget to add changes to the index if needed or use '-a' option, otherwise they will be lost.
--- main.m        (before formatting)
+++ main.m        (after formatting)
@@ -21,8 +21,8 @@
 #else
             shouldLog = NO;
 #endif
-            NSDictionary* configuration  = @{ @"isLoggingEnabled" : @(isLoggingEnabled) };
-            [[NSUserDefaults standardUserDefaults] registerDefaults: configuration];
+            NSDictionary *configuration = @{ @"isLoggingEnabled" : @(isLoggingEnabled) };
+            [[NSUserDefaults standardUserDefaults] registerDefaults:configuration];
 
         }
</pre>


If the author of the commit agrees the found issues are reasonable, and not false complaints, the patch generated can be used to fix the committed changes as follows:


<pre>
$ cat /var/folders/hs/p6xmm3hs3x51pzc2jd3__wrr0000gq/T/com.badoo.codestyle.4nvjrD.patch | patch -p0
</pre>


Otherwise these complaints can be ignored by specifying *-n*/*--no-verify* options in the command line or just ignoring hooks in such tools like [SourceTree](https://www.sourcetreeapp.com/). Unfortunately, **git** support in Xcode does not allow us to ignore installed hooks, so in order to commit changes which are falsely considered unacceptable it has to use an alternative approach.


The hook and the script to install it can be found [here](https://github.com/badoo/objective-c-style-guide/tree/master/scripts).


In order to re-use it in your project, it has to modify the path to the **clang-format** binary in your repository (change value for the *binary* variable in the *pre_commit.py* file) and optionally prefix for generated patches (by changing value of the *patch_prefix* variable in the same file):


<pre>
....
binary = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '..', 'bin', binary_name))
patch_prefix = 'com.badoo.codestyle.'
....
</pre>


*install_pre_commit_hook.py* can be used easily to install the mentioned hook, another word to let **git** know about this hook.


Note, if you're using [BBUncrustifyPlugin-Xcode](https://github.com/benoitsan/BBUncrustifyPlugin-Xcode) plug-in, it contains its own copy of the **clang-format** tool so it has to sync versions of **clang-format** used by the plug-in and **git** hook to avoid differences and surprises when committing changes.


## What's next: warnings for code style issues


The above-described **git hook** works out for us, but when it comes time to fix style issues it has to switch contexts -- come back to the editor, make changes, and repeat commit. Wouldn't it be great if such issues appeared as warnings when a source file gets compiled? In that case, all styling issues can be detected and fixed along the way and those which lead to unavoidable false complaints [can be ignored](http://clang.llvm.org/docs/ClangFormatStyleOptions.html#disabling-formatting-on-a-piece-of-code).


It's not currently possible to easily integrate such checks with the existing compiler infrastructure, so what can we do is to replace the default compiler with a wrapper by specifying the **CC** build setting:


<pre>
CC = "$SRCROOT/tools/wrappers/clang.py”
</pre>


The wrapper may look like as follows:


<pre>
#!/usr/bin/env python


import os
import subprocess
import sys
import StringIO


binary_name = 'clang-format'
binary = os.path.abspath(os.path.join(os.path.dirname( __file__ ), binary_name))


def call_original_executable():
    command = ['/usr/bin/xcrun', '-r', 'clang']
    for argument in sys.argv[1:]:
        command.append(argument)
    subprocess.call(command)


def main():
    filename = None
    arguments = sys.argv
    arguments_length = len(arguments)
    for i in range(0, arguments_length):
        if arguments[i] == '-c' and i < arguments_length:
            filename = arguments[i + 1]
            break
    
    if not filename:
        call_original_executable();
        return
        
    command = [binary, '-style=file', filename]
    p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=None, stdin=subprocess.PIPE)
    stdout, stderr = p.communicate()
    if p.returncode != 0:
        sys.exit(p.returncode)


    formatted_code = StringIO.StringIO(stdout).readlines()
    with open(filename) as f:
        code = f.readlines()


    code_length = len(code)
    if code_length != len(formatted_code):
        sys.stderr.write(filename + ':0:0: warning: CAN NOT CHECK STYLE; DIFFERENT NUMBER OF LINES\n')
        exit(0)
        
    for i in range(0, code_length):
        if code[i] != formatted_code[i]:
            sys.stderr.write(filename + ':' + str(i) + ':1: warning: STYLE ERROR, EXPECTED:' + formatted_code[i] + '\n')
            
    call_original_executable()


if __name__ == '__main__':
    main()
</pre>


This script extracts a path to file being compiled (if any), executes **clang-format** for it and obtains formatted lines of source code, then it compares formatted and unformatted lines. Once it finds a difference it emits warnings in the predefined format for errors, warning and notes. This format is not documented, but it’s quite simple and can be easily deduced by analysing output from the standard compiler:


<pre>
FILENAME:LINE:COLUMN: warning|error|note: MESSAGE
</pre>


For simplicity, if the number of formatted and unformatted lines differs, the script just gives up. Finally it executes the original (replaced) executable.


The problem with this approach is that for some reason Xcode just ignores these warnings. No matter how hard we tried -- using both standard output and error streams, even if all ANSI scan codes are replicated -- still Xcode does not digest the output.


This approach does not have so many benefits when it is used in the context of Xcode, but it may be useful with some other tools which are less restrict and appreciate these warnings. Perhaps someone reading this knows the secret sauce needed to make Xcode work, and if so,  sharing the recipe in comments would be highly appreciated.