---
layout: post
title: Code coverage at Badoo
author: Ilya Ageev
date: 2015-03-09
categories: qa php
---
<p style='font-size:90%;text-style:italic;'>
This article was written over a year ago and since then code coverage estimation has continued to evolve. However the basic approach described in this article has become the standard, which has allowed us to almost double the number of tests without much hassle. Now there are almost 50,000 tests and compile time is nine hours. We’re constantly working to speed up the code coverage calculation process, and plan to release the next set of fixes in the near future.
</p>
---
<br/>
<br/>
<img alt="Speed" src="{{page.imgdir}}/moto.jpg" style="float: left; max-width: 50%; margin-right: 10px;" />
Some time ago we accelerated code coverage report generation from 70 hours to 2.5 hours. This was implemented as an additional exporting/importing format for the code coverage report. And not long ago our pull requests made it into the official **phpunit**, **phpcov**, **and php-code-coverage** repositories.

At conferences and in articles, we have repeatedly related that we grind through thousands of unit tests in a short period of time. The effect is mainly achieved, as you might guess, through multithreading. That could be the end of the story, but code coverage is one of the most important test metrics.

Today we'll discuss how to compute and aggregate test code coverage results in a multithreaded environment - and how to do it quickly. Without our optimizations, calculating code coverage took more than 70 hours just for the unit tests. After our optimizations, we now only spend 2.5 hours to run code coverage across all unit tests and two sets of integration tests, more than 30,000 tests in all.

At Badoo, we write tests in PHP and use the [PHPUnit](http://phpunit.de/) Framework devised by Sebastian Bergmann. In this framework, as in many others, coverage is computed through simple calls with the help of the [Xdebug](http://xdebug.org/) extension:
{% highlight sh %}
xdebug_start_code_coverage();
//… code is executed here …
$codeCoverage = xdebug_get_code_coverage();
xdebug_stop_code_coverage();
{% endhighlight %}

The output is a nested array that contains the files executed during the coverage run, plus line numbers with special flags that indicate whether the code was executed, and whether it should have been executed at all. You can read more about code coverage analysis using Xdebug on the project's [website](http://www.xdebug.org/docs/code_coverage).

Sebastian Bergmann created the [PHP_CodeCoverage](https://github.com/sebastianbergmann/php-code-coverage) library, which is responsible for collecting, processing, and displaying code coverage results in various formats. The library is convenient, extensible, and satisfies us completely. It has a command-line-based front end called [phpcov](https://github.com/sebastianbergmann/phpcov).

But the PHPUnit calls themselves also already include the ability to compute and display code coverage in various formats:

{% highlight sh %}
--coverage-clover <file>  Generate code coverage report in Clover XML format.
--coverage-html <dir>     Generate code coverage report in HTML format.
--coverage-php <file>    Serialize PHP_CodeCoverage object to file.
--coverage-text=<file>  Generate code coverage report in text format.
{% endhighlight %}

The --coverage-php option is what we need for a multi-threaded launch: each thread calculates code coverage and exports the results to a separate *.cov file. Calling phpcov with the --merge flag aggregates and displays results in a beautiful HTML report.

{% highlight sh %}
--merge                 Merges PHP_CodeCoverage objects stored in .cov files.
{% endhighlight %}

Everything is displayed an orderly and attractive way and should work "out of the box". However, it is obvious that not everyone uses this mechanism, including the library's own author. Otherwise, the "non-optimal" nature of PHP_CodeCoverage's import/export mechanism would have quickly come to the surface. Let's take this in stages to figure out what's going on.

Exporting to the *.cov format is handled by the special [PHP_CodeCoverage_Report_PHP](https://github.com/sebastianbergmann/php-code-coverage/blob/3e09776b984dba56dfcd866226e0524b14b9af0c/PHP/CodeCoverage/Report/PHP.php) class, which has a very simple interface. It consists of a process() method, which takes a PHP_CodeCoverage object and serializes it using the serialize() function.

The result is written to a file (if a path to a file was passed in) or returned by the method.
{% highlight sh %}
class PHP_CodeCoverage_Report_PHP
{
    /**
     * @param  PHP_CodeCoverage $coverage
     * @param  string           $target
     * @return string
     */
    public function process(PHP_CodeCoverage $coverage, $target = NULL)
    {
        $coverage = serialize($coverage);

        if ($target !== NULL) {
            return file_put_contents($target, $coverage);
        } else {
            return $coverage;
        }
    }
}
{% endhighlight %}

Conversely, phpcov's import utility takes all of the files with a *.cov extension in a directory and [unserializes](https://github.com/sebastianbergmann/phpcov/blob/9fa09b40f410ee1a78df59d6007fe9e80a87ee0a/src/MergeCommand.php#L107) them into an object. The object is then passed to the merge() method of the PHP_CodeCoverage object where the code coverage results are being aggregated.
{% highlight sh %}
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $coverage = new PHP_CodeCoverage;

        $finder = new FinderFacade(
            array($input->getArgument('directory')), array(), array('*.cov')
        );

        foreach ($finder->findFiles() as $file) {
            $coverage->merge(unserialize(file_get_contents($file)));
        }

        $this->handleReports($coverage, $input, $output);
    }
{% endhighlight %}

The merge process itself is very simple. It is an array_merge() with minor nuances, such as ignoring what has already been imported or what was passed as a filter parameter to the call to phpcov (--blacklist and --whitelist).

{% highlight sh %}
     /**
     * Merges the data from another instance of PHP_CodeCoverage.
     *
     * @param PHP_CodeCoverage $that
     */
    public function merge(PHP_CodeCoverage $that)
    {
        foreach ($that->data as $file => $lines) {
            if (!isset($this->data[$file])) {
                if (!$this->filter->isFiltered($file)) {
                    $this->data[$file] = $lines;
                }

                continue;
            }

            foreach ($lines as $line => $data) {
                if ($data !== NULL) {
                    if (!isset($this->data[$file][$line])) {
                        $this->data[$file][$line] = $data;
                    } else {
                        $this->data[$file][$line] = array_unique(
                          array_merge($this->data[$file][$line], $data)
                        );
                    }
                }
            }
        }

        $this->tests = array_merge($this->tests, $that->getTests());
    }
{% endhighlight %}

It was this approach of using serialization and deserialization that proved problematic in quickly running code coverage. The community has repeatedly discussed the performance of PHP's serialize and unserialize functions:
[http://stackoverflow.com/questions/1256949/serialize-a-large-array-in-php](http://stackoverflow.com/questions/1256949/serialize-a-large-array-in-php);
[http://habrahabr.ru/post/104069](http://habrahabr.ru/post/104069), etc.

For our small project, whose PHP repository contains more than 35,000 files, the coverage files are huge, several hundreds of megabytes each. The final file, which is "merged" from different threads, is nearly two gigabytes. Working on these volumes of data, the unserialize() method was revealed in all its glory. We waited several days for the code coverage results.

So we decided to try the most obvious optimization technique: var_export and include.

We added a new [reporter class](https://github.com/uyga/php-code-coverage/blob/230e5d75df90518f6b266d88350cf85a0dd1e6d9/PHP/CodeCoverage/Report/PHPSmart.php), which uses var_export to export in a new format, to the php-code-coverage repository:

{% highlight sh %}
class PHP_CodeCoverage_Report_PHPSmart
{
    /**
     * @param  PHP_CodeCoverage $coverage
     * @param  string           $target
     * @return string
     */
    public function process(PHP_CodeCoverage $coverage, $target = NULL)
    {
        $output = '<?php $filter = new PHP_CodeCoverage_Filter();'
            . '$filter->setBlacklistedFiles(' . var_export($coverage->filter()->getBlacklistedFiles(), 1) . ');'
            . '$filter->setWhitelistedFiles(' . var_export($coverage->filter()->getWhitelistedFiles(), 1) . ');'
            . '$object = new PHP_CodeCoverage(new PHP_CodeCoverage_Driver_Xdebug(), $filter); $object->setData('
            . var_export($coverage->getData(), 1) . '); $object->setTests('
            . var_export($coverage->getTests(), 1) . '); return $object;';

        if ($target !== NULL) {
            return file_put_contents($target, $output);
        } else {
            return $output;
        }
    }
}
{% endhighlight %}

We humbly named the file format "PHPSmart". These files have the *.smart file extension.

To allow the PHP_CodeCoverage class to import and export in the new format, setters and getters were added for its properties.

Then after a few changes to the phpunit and phpcov repositories to adapt them to work with the class, our code coverage runs took only two and a half hours.

This is what import looks like:
{% highlight sh %}
    foreach ($finder->findFiles() as $file) {
        $extension = pathinfo($file, PATHINFO_EXTENSION);
        switch ($extension) {
            case 'smart':
                $object = include($file);
                $coverage->merge($object);
                unset($object);
                break;
            default:
                $coverage->merge(unserialize(file_get_contents($file)));
        }
    }
{% endhighlight %}

You can find our changes on GitHub and try this approach in your own projects.
[github.com/uyga/php-code-coverage](https://github.com/uyga/php-code-coverage)
[github.com/uyga/phpcov](https://github.com/uyga/phpcov)
[github.com/uyga/phpunit](https://github.com/uyga/phpunit)

We sent Sebastian Bergmann pull requests for our changes, hoping they would soon appear in the author's official repositories.
[github.com/sebastianbergmann/phpunit/pull/988](https://github.com/sebastianbergmann/phpunit/pull/988)
[github.com/sebastianbergmann/phpcov/pull/7](https://github.com/sebastianbergmann/phpcov/pull/7)
[github.com/sebastianbergmann/php-code-coverage/pull/185](https://github.com/sebastianbergmann/php-code-coverage/pull/185)

But he closed them, saying he didn't want another format - he wants our format instead of his own:
<img alt="Sebastian Bergmann" src="{{page.imgdir}}/image1.jpg"/>

We were happy to oblige. And now our changes have become part of the author's official repositories, replacing the format previously used in *.cov files.
[github.com/sebastianbergmann/php-code-coverage/pull/186](https://github.com/sebastianbergmann/php-code-coverage/pull/186)
[github.com/sebastianbergmann/phpcov/pull/8](https://github.com/sebastianbergmann/phpcov/pull/8)
[github.com/sebastianbergmann/phpunit/pull/989](https://github.com/sebastianbergmann/phpunit/pull/989)

This small optimization helped us accelerate our code coverage by a factor of nearly 30! It allowed us not only to drive unit tests for code coverage, but also to add two sets of integration tests. This did not substantially affect the time spent on importing, exporting, and merging results.

P.S.:
<img alt="Thank you	" src="{{page.imgdir}}/image2.png"/>
