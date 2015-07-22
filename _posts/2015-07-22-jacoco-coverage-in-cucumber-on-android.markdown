---
layout: post
title: JaCoCo coverage in Cucumber on Android
author: Tim Baverstock
date: 2015-07-22
categories: android cucumber
---

In an ideal world, all requirements would be specified clearly, comprehensive tests would be derived from those requirements, and the whole of the application would be tested. In practice, we're only human. 

Coverage is a useful means of discovering which parts of your application have fallen between the cracks in your test cases, and an historical analysis on a per-test basis can alert you to shifts in implementation that might warrant attention. For management it's a nice graph to admire. :)

It's well supported on Android JUnit testing (previously with Emma, more recently with JaCoCo under Gradle), and Calabash-iOS already seems to support it, but a web search for Android coverage under Calabash-Android didn't yield any results. 

Rather than just presenting a rabbit pulled from a hat, here's an outline of how I arrived at a solution.

The solution is at the end, if you can't wait.

Calabash-Android lifecycle
--------------------------

From previous work, I already knew that Calabash tweaks a pre-built server, re-signs it (i.e. updates its META-INF directory) to account for the tweaks, and then runs it. What I didn't realise was that while Calabash starts its server on the Android device using a normal `adb shell am instrument` JUnit command, it completely subverts the mechanism to give its server access to the instrumentation usually available only to JUnit tests.

Calabash's 'junit test' runs under the test-runner [CalabashInstrumentationTestRunner.java](https://github.com/calabash/calabash-android/blob/master/ruby-gem/test-server/instrumentation-backend/src/sh/calaba/instrumentationbackend/CalabashInstrumentationTestRunner.java), which starts the web server 'as early as possible' and eventually runs its solitary test case in [InstrumentationBackend.java](https://github.com/calabash/calabash-android/blob/master/ruby-gem/test-server/instrumentation-backend/src/sh/calaba/instrumentationbackend/InstrumentationBackend.java), called 'testHook'. This 'test' sets various things up, but ultimately performs a `System.exit(0)` if it sees a useable main activity, causing the entire JUnit test sequence to terminate at that point.

This use of `System.exit(0)` prevents InstrumentationBackend.tearDown() executing - which is there to shut down the server if the activity isn't detected. It also forestalls the post-testing part of Android's InstrumentationTestRunner (which is where coverage is usually dumped).

### So far, so good.

Unfortunately, simply copying InstrumentationTestRunner's [coverage dumping code](https://github.com/android/platform_frameworks_base/blob/master/test-runner/src/android/test/InstrumentationTestRunner.java#L598) into a new endpoint in the Calabash InstrumentationBackend didn't work immediately for me. It raised `java.lang.IllegalStateException: JaCoCo agent not started`, which the web suggested was caused by no instrumented class having been loaded by the current classloader.

Inspecting my APK's classes.dex with [baksmali](https://code.google.com/p/smali/) showed no JaCoCo references, whereas an APK from a normal library JUnit coverage build showed classes with various synthetic 'jacoco' elements. Notably, none were library classes - I had enabled coverage in my APK's libraries, but not in the app's own (because at that stage the minimal application code was not so interesting).

It turns out that debug app builds link in release libraries, and only debug libraries are normally built with coverage. According to the Android team, you don't need coverage for an app's libraries because you should be unit-testing them as libraries, so coverage on Cucumber needs plumbing. After a fruitless diversion into the Android/Gradle plugin's source code, I was delighted to find [this workaround](https://code.google.com/p/android/issues/detail?id=76373#c11) posted by Martin.n that I was able to apply and embellish.

After another fruitless diversion, trying to retrieve the application's dependencies in order to locate their source files and class files (including looking through the androidDependencies target that spits the requisite library information onto the screen, but doesn't make it readily available through an API), I decided to hard-wire the list of libraries. This later proved useful for unifying the normal JUnit library coverage into one report.

From there, it was just a matter of retrieving the coverage from the application under test just before calabash-android was about to kill the server, and before it tried to clear application data, both of which required only small additions to android/operations.rb. You'll see this in the patch mentioned below.

Solution
--------

The solution comprises: 1. a [patch to calabash-android](https://github.com/badoo/calabash-android/commit/0acc0d1d98e485336c3a37b599a8b052063e85a4), 2. some additions to the gradle build, and 3. a few command-line changes on your build and calabash commands.

### Additions to your build

At the bottom of this post, there's a gradle file. We call it 'jacococoverage.gradle' and keep it in the root of the project.

Our build structure happens to have our apps all at the top project level, and our libraries are inside two top-level directories called 'libraries' and 'components'.

{% highlight groovy %}
 root -+--- FirstApp
       +--- OtherApp
       +--- libraries
       | +--- SomeLibrary
       | +--- etc.
       +--- components
         +--- etc.
{% endhighlight %}

If your structure differs, it shouldn't be hard to adapt the sourcefiles and classfiles paths in the gradle build file's `(areas.components.list ?: {}).each { comp ->` closure, and to add more such chunks, to match your structure.

To build your release libraries (and components) with coverage 'on', create a new file like the following, calling it 'libcoverage.gradle':

{% highlight groovy %}
android {
  buildTypes {
    release {
      // Instrument all release libraries for calabash app coverage
      testCoverageEnabled = project.has('globalCoverage')
    }
  }
}
{% endhighlight %}


After you apply the Android plug-in in your libraries' build.gradle files, apply this new file too as follows (adjust the path depending on where you put the file):

{% highlight groovy %}
    apply plugin: 'com.android.library
    apply from: '../../libcoverage.gradle'
{% endhighlight %}

Into your application's build.gradle file, apply the attached jacococoverage.gradle file (in much the same way as you applied libcoverage.gradle to your libraries), and customise the section at its start.

{% highlight groovy %}
def defaultAreas() {
  [
    apps: [
      variant: 'internalbadoo/QA',
      list: [ 'FirstApp', 'OtherApp' ]
    ],
    libraries: [
      variant: 'release',
      list: [
        'SomeLibrary', 'AnotherLibrary', 'etc' ]
    ],
    components: [
      variant: 'release',
      list: [ 'SomeCustomViews' ]
    ]
  ]
}
{% endhighlight %}

To control the classes which aren't included for coverage, change this (subclasses are implicitly excluded):

{% highlight groovy %}
def exclusionPatterns = [
    // Auto-generated classes
    '**/R',
    '**/Manifest',
    '**/BuildConfig',

    // Third-party classes
    'android/**/*',
    'com/google/**/*',
    'com/android/**/*',
    'javax/**/*',

    // Boiler-plate classes
    'com/badoo/boiler/plate/**/*',
]
{% endhighlight %}

Now build your app (and its libraries) from clean with `-PglobalCoverage=true` added to your gradle flags.

Patching Calabash-Android

Check out [this patch](https://github.com/badoo/calabash-android/commit/0acc0d1d98e485336c3a37b599a8b052063e85a4) to calabash-android, build it from its ruby-gem directory with `rake build`, then use `gem install` (or `gem install --local`) to install it. Now with the env-var `COVERAGE_DIR` pointing somewhere (we direct it into `build/outputs/coverage-files` inside the gradle project), run calabash however you normally run it. Something like:

{% highlight bash %}
 export COVERAGE_DIR=~/git/badoo/build/outputs/coverage-files
 bundle exec calabash-android run your.apk -p android_tests ...
{% endhighlight %}

### Generating the report

If your coverage `.ec` files are within the git repository (per the suggested `COVERAGE_DIR`), you can generate the report like this:

{% highlight bash %}
 ./gradlew yourApp:createJacocoReport
{% endhighlight %}

If you need to change the root of the tree where the coverage.*ec files are looked for, specify that with -PcoverageDataRoot=... - this is relative to the project root, but by default includes the whole project root.

If you need to change where the coverage reports are placed, specify `-PcoverageOutDir=...` but by default it's build/outputs/reports/coverage.

You can tweak the 'defaultAreas' specified in the jacococoverage.gradle file with `-PcoverageAreas`, which takes a JSON-formatted string as an argument that can merge, remove, or overwrite components. There are examples in the jacococoverage.gradle file's header comment.

Incidentally, because ALL coverage.ec files are incorporated, this will scoop up any normal JUnit coverage results into the final report. So unless you want that, be sure to clear them out beforehand or change the search root with -PcoverageDataRoot.

Addendum
--------

I stumbled across a few things that may be of interest:

1. [Cucumber-Jvm](https://github.com/cucumber/cucumber-jvm) - A Java implementation of Cucumber which apparently supports coverage. Sadly, we're using the Ruby version and have common code between iOS and Web, so we can't use this at first blush. You might find it useful.
2. Jacoco unresolved dependency for the root project in multimodule build 
3. Android Gradle Plugin User Guide 
4. <https://plus.google.com/+OleksandrKucherenko/posts/RreU44qmeuP> concerning the generation of coverage.xml files
5. <https://code.google.com/p/android/issues/detail?id=76373#c11> the basis of our jacocococococoverage.gradle file.
6. Yes, I know 'JaCoCo' stands for 'Java Code Coverage', making 'jacococoverage' somewhat tautological.


jacococoverage.gradle
---------------------

{% highlight groovy %}

import groovy.json.JsonSlurper

/* Universal coverage report generator.
 *
 * -PcoverageOutDir = location for report, default = root/build/outputs/reports/coverage
 * -PcoverageDataRoot = root from which to look for coverage.*ec files, within project
 * -PcoverageAreas = Json-style editing of the default areas to include in coverage as described below.
 *     
 * Override default variant for apps:
 *      -PcoverageAreas='{"apps":{"variant":"badoo/debug"}}'
 *
 * Exclude 'OtherApp' from coverage:
 *      -PcoverageAreas='{"apps":{"list-":["OtherApp"]}}'
 *
 * Include 'SecretApp' into coverage:
 *      -PcoverageAreas='{"apps":{"list+":["SecretApp"]}}'
 *
 * Exclude all apps from coverage:
 *      -PcoverageAreas='{"apps=":{}}'
 *
 * Override default variant for all areas:
 *      -PcoverageAreas='{"apps":{"variant":"badoo/debug"}, "libraries":{"variant":"debug"}, "components":{"variant":"debug"}}'
 *
 * Default edit operation is append for lists, deep merge for maps, and replace for values.
 */

def defaultAreas() {
    [
        apps: [
            variant: 'internalbadoo/QA',
            list: [ 'OurApp', 'OurOtherApp' ]
        ],
        libraries: [
            variant: 'release',
            list: [
                'OurCommon', 'OurDownloader', 'This', 'That', 'TheOther' ]
        ],
        components: [
            variant: 'release',
            list: [ 'SubsidiaryScreen' ]
        ]
    ]
}

def exclusionPatterns = [
    // Auto-generated classes
    '**/R',
    '**/Manifest',
    '**/BuildConfig',

    // Third-party classes
    'android/**/*',
    'com/google/**/*',
    'com/android/**/*',
    'javax/**/*',

    // Boiler-plate classes
    'com/badoo/boiler/plate/**/*',
]

def excludeClasses = exclusionPatterns.collect { "${it}.class,${it}\$*.class" }.join(',')

configurations { jacocoReportAnt }
dependencies {
    // Unfortunately, we are unable to have jacoco as a top-level target due to this project.android reference.
    jacocoReportAnt group: "org.jacoco", name: "org.jacoco.ant", version: project.android.jacoco.version
}

// Try to find the named preferred variant root of class files, or choose something consistent and sensible
def findVariant(dir, preferred) {
    while (dir.listFiles().grep{ f -> f.isDirectory() }.size() > 1 &&
            !(['com', 'android', 'javax'].grep{ new File(dir, it).exists() })) {
        def dirs = dir.listFiles().grep{ f -> f.isDirectory() }
        def preference = dirs.grep{ f -> f.getName().equals(preferred) }
        dir = preference ? preference.first() : dirs.sort().last()
    }
    println "Var: ${dir}"
    return dir
}

// Edit 'into' based on 'from', return 'into' for convenience
def deepMerge(into, from) {
    from.each { k, v ->
        try {
            if (k =~ /\+$/) {
                into[k[0..-2]] += v
            }
            else if (k =~ /-$/) {
                into[k[0..-2]] -= v
            }
            else if (k =~ /=$/) {
                into[k[0..-2]] = v
            }
            else if (v instanceof Map) {
                deepMerge(into[k], v)
            } 
            else if (v instanceof List) {
                into[k] += v
            }
            else {
                into[k] = v
            }
        }
        catch (Throwable e) {
            throw new RuntimeException("At key ${k} in either ${from.keySet()} or ${into.keySet()} from ${from} or ${into}", e)
        }
    }
    return into
}

// wrapper for deepMerge to avoid Gradle swallowing the exception report.
def mergeAreas(json) {
    try {
        return deepMerge(defaultAreas(), new JsonSlurper().parseText(json))
    }
    catch (Throwable e) {
        e.printStackTrace(System.err)   // Otherwise, error is swallowed.
        return [apps:[list:[]], libraries:[list:[]], components:[list:[]]]
    }
}

// Copy main stats to top of the table/page: dashboard friendly.
def copyTotalsToTop(root) {
    root.eachFileRecurse { file ->
        if (file =~ /\.html$/) {
            def xml = file.text
            // Changed /regex/ to 'regex' for formatting purposes here and below.
            (xml =~ '<tfoot>(.*?)<\/tfoot>').each { match, row ->
                xml = xml.replace('</thead>', "${row}</thead>")
                def cells = (row =~ '<td(?: class=".*?")?>(.*?)<\/td>').collect {it[1]}
                xml = xml.replace('</h1>', " (line: ${cells[2]}  branch: ${cells[4]})</h1>")
            }
            file.withWriter { it << xml }
        }
    }
}

def coverLibrary(things, place) {
    (things.list ?: {}).each {
        sourcefiles {
          fileset(dir: file("${place}/${it}/src/main/java"))
        }
        classfiles {
            def dir = new File("${place}/${it}/build/intermediates/classes")
            fileset(dir: findVariant(dir, things.variant), excludes: excludeClasses)
        }
    }
}

task createJacocoReport {
    doLast {
        def root = project.getRootDir()

        File reportOutDir = file(project.has('coverageOutDir') ? project.coverageOutDir : "${root}/build/outputs/reports/coverage")
        def coverageDataRoot = project.has('coverageDataRoot') ? new File(root, project.coverageDataRoot) : root
        def areas = mergeAreas(project.has('coverageAreas') ? project.coverageAreas : '{}')
        println areas

        reportOutDir.deleteDir()
        reportOutDir.mkdirs()

        getAnt().taskdef(name: 'reportWithJacoco',
                classname: 'org.jacoco.ant.ReportTask',
                classpath: configurations.jacocoReportAnt.asPath)
        getAnt().reportWithJacoco {
            executiondata {
                coverageDataRoot.eachFileRecurse {
                    if ( it =~ /coverage\..*ec$/ ) {
                        println "Cov: ${(''+it.length()).padLeft(6)} ${it}"
                        fileset(file:it)
                    }
                }
            }
            structure(name: 'Unified coverage') {
                (areas.apps.list ?: {}).each { app ->
                    sourcefiles {
                        fileset(dir: file("${root}/${app}/src/main/java"))
                        [ file("${root}/${app}/build/generated/source/aidl/${areas.apps.variant}"),
                          file("${root}/${app}/build/generated/source/rs/${areas.apps.variant}") ].each {
                            if ( it.exists() ) { fileset(dir: it) }
                        }
                    }
                    classfiles {
                        [ file("${root}/${app}/build/intermediates/classes/${areas.apps.variant}") ].each {
                            if (it.exists()) { fileset(dir: it, excludes: excludeClasses) }
                        }
                    }
                }
                coverLibrary(areas.libraries, "${root}/libraries")
                coverLibrary(areas.components, "${root}/components")
            }

            html(destdir: reportOutDir)
            xml(destfile: new File(reportOutDir, "report.xml"))
        }
        copyTotalsToTop(reportOutDir)
        println "Coverage: open ${reportOutDir}/index.html"
    }
}
{% endhighlight %}
