---
layout: post
title:  Better Memory Dumps on Android 
author: Erik Andre
date:   2015-05-26
categories: android
---

This is a follow-up on the previous article about Deobfuscating HPROF memory dumps. Reading that article isn’t a requirement, some knowledge of the HPROF file format is useful.

While implementing the previously mentioned HPROF deobfuscator I became familiar enough with the HPROF file format to realize that there are several aspects of it that could be optimized for usage on mobile devices.

The HPROF format has been around since at least the late 1990s (earliest mention I could find was a bug report from 1998) and since then it has not changed much. Even when Google adopted it as the standard memory dump format for Android they only made some minor additions (requiring the use of hprof-conv to convert to standard HPROF format).

In this article I will make the case for moving to a better (in my opinion) file format and show the benefits and new opportunities that such a move would allow.

## TL:DR Show me the code!

The full source code for the Java libraries as well as a working example for Android is available on our [GitHub page](https://github.com/badoo/hprof-tools).

## What’s wrong with HPROF?

**Inefficient Data Encoding**

In the HPROF format, all integers and floating point numbers are stored as fixed length fields (e.g integers take 4 bytes, longs take 8 bytes and so on). For most cases this is very inefficient encoding, and it’s one of the contributors to making HPROF files as large as they are.

By applying the same varint1 (variable length integer) encoding used by protocol buffers2 we can significantly reduce file size. In this encoding format an integer will be stored using 1 to 5 bytes depending on the value, with large values requiring more bytes. Since varints are most efficient for encoding small values (where fewer bytes are needed to represent the value) it would also make sense to replace large values with small ones wherever possible.

One such opportunity involves object and string ids. When debugging a Java application you have probably encountered these in the form of the output of the default toString() method (Object@1434334). The number after the @ symbol is the object id, and as in the example these are often quite high values. If we could remap these ids starting at 1, say, we should once again be able to reduce the file size.

**Unused fields**

An Android-specific issue with HPROF is that the format contains data that might be relevant to a desktop or server-side Java application:

* Protection domain ids.
* Stack trace serial numbers.
* Signers object ids.
* Thread serial numbers.
* Reserved fields (in class dumps).

All of these can be discarded without any side effects (as far as I can see so far) .

**Complex file format**

As described in the previous article, an HPROF file consists of a file header followed by a number of records. Some of these records (heap dump and heap dump segment) in turn contains sub-records. These sub-records makes parsing the file more complex, but at the same time provide no apparent benefit.

Another issue with the HPROF record structure is that each record starts with a header that contains the size of the record in bytes. This means that you must either first write the full record to an in-memory buffer before creating the header, or perform a first pass where you calculate the record size before writing it. This might not seem like a big deal but consider that some records can take up a significant amount of memory (i.e heap dump records).

**Clear text strings**

Strings can make up a fairly large part of a HPROF file. For example, a memory dump taken of the Badoo app (while running under normal circumstances) contains about 1.5MB of strings. While these strings could be compressed (e.g using zip) the truth is that most of these strings are not needed in the first place. If you look through the strings you’ll notice that most of them are names of classes, fields, methods or string constants. Of course, these are useful things to have when analyzing the dump but there is no reason why they should be stored in the dump file itself (as long as you have access to the application of which the dump comes from).

## Introducing the Badoo Memory Dump (BMD) format

After identifying the problem areas of HPROF I decided to create a new, more efficient file format (see [http://xkcd.com/927/](http://xkcd.com/927/)). The design goals of the format are first of all to to reduce the file size and then to make sure sure that the files can be read and written using as few system resources as possible (to make it a good fit for mobile devices). 

* Integer and floating point numbers encoded as varints.
* Flat record structure.
* No record size in record headers (reduces amount of memory used for buffers).
* Strings can be either stored in the clear or hashed (reduces size and improves privacy).
* Primitive arrays replaced with placeholders.
* Unsupported HPROF records can be repackaged as legacy records.

A full specification of the format can be found on the Badoo github page.

## Crunching and decrunching

A new file format is not very useful without a practical application and that is where the two applications **HprofCruncher** and **HprofDecruncher** come in. Cruncher converts from HPROF to BMD and is meant to be run on the device where the dump was generated. Depending on the contents of the HPROF file, you can expect it to create a 1-2MB BMD file given a 50MB HPROF file as input.

Due to the ordering of data in an HPROF file the conversion operation is performed in two passes, which means the the source HPROF file is read twice. The problem with this ordering is that an instance dump (containing the instance fields of an object) can come before the class definition of the class that it instantiates. In order to convert the file in one pass you would need to keep an unknown number of instance data records in memory until you have resolved their entire class hierarchy (the worst case would be if all instance dumps are written before the the class definitions, in which case you might need more memory to process the dump than what is available).

**First cruncher pass**

In the first pass the file header is first read and converted to a BMD header, following this each record is read and processed. At the end of this pass we have a BMD file containing all strings, class definitions and any HPROF fields that we do not support converting (wrapped as LEGACY_HPROF_RECORDs).

* STRING records are hashed and written to the output file as a BMD STRING record.
* LOAD_CLASS records are read but nothing is written since there is no matching record in BMD.
* CLASS_DUMP records are read, an updated class created with some fields discarded and a BMD CLASS DEFINITION record is written. The class definition is then kept in memory to be used in the second pass.
* All other records which are not sub-records to a HEAP_DUMP or HEAP_DUMP_SEGMENT record are wrapped into LEGACY_HPROF_RECORD records before being written.

**Second cruncher pass**

The second cruncher pass is simpler than the first. In this pass we are only concerned with sub-records of HEAP_DUMP and HEAP_DUMP_SEGMENT records. At the end of the second pass we have a complete BMD file.

* INSTANCE_DUMPs are read, updated based on the class definition from the first pass and then written as BMD INSTANCE_DUMP records.
* OBJECT_ARRAY records are read and converted to BMD OBJECT_ARRAY records.
* PRIMITIVE_ARRAYS are read, their contents stripped and then written as PRIMITIVE_ARRAY_PLACEHOLDER records.
* All root object records (e.g ROOT_STICKY_CLASS, ROOT_JAVA_FRAME, etc) are collected and written as one ROOT_OBJECTS record.

**Cruncher optimizations**

Besides converting to BMD, cruncher also performs several other optimizations:

* Discard primitive fields (as they are usually not required to analyze out of memory situations).
* Remap all object and string ids starting at 1 (0 is reserved for null values).
* Replace most strings with hashes (reduce file size and improves privacy).

As an added benefit, by discarding primitive fields and array data as well as hashing strings we are creating an anonymized memory dump which will come in very handy if we want to upload the file from the device to a server (more on this later).

**Decruncher**

As the name might hint at, decruncher does the opposite of cruncher, it converts BMD files to HPROF (so that you can load the file into your favorite memory analyzer). Its input is a BMD file but it also accepts .jar and .apk files as a secondary input. These files are needed in order to recreate the hashed strings stored in the BMD file.

Decruncher will create a HPROF file that has similar contents to the original HPROF file but there are some significant differences:

* Primitive fields are replaced with placeholder fields (not only the field content but also the field type is lost). The replacement fields that are inserted are only there to keep the object size consistent with the original one. This is done to make sure that OutOfMemory issues can be debugged.
* All strings that were not part of the originally built application will be lost. This means that text entered by the user, or received from an outside source (network communication) are lost and replaced with a placeholder string which contains the string hash value.
* All root objects are reported as UNKNOWN_ROOT records which means that you cannot know if the object was referenced from the heap, stack or from JNI.

## Where to go from here?

Now when memory dumps can be made small enough to transmit over the internet it opens up several new opportunities. The most obvious one is that you could let your application upload a dump file to a server after crashing due to an out of memory situation, similar to how crashes are reported to a service like Crittercism or HockeyApp.

However, it’s when you follow this idea to its next step that things start to get really interesting. How about sending memory dumps not only when your app has run out of memory but also when it has crashed due to some other error? How many bugs could be easily found and fixed if you could inspect the (almost) complete state of the app when the crash occurred?

A further area of exploration is to turn cruncher into a more generic HPROF to BMD converter, one where you can decide what information is kept and what is discarded. In its current incarnation, the tool is solely focused on generating an output file of minimal size, however this might not always be the desired end-result (especially if you want to use the dump to debug crashes other than Out Of Memory situations).

## References

1. [http://en.wikipedia.org/wiki/Variable-length_quantity](http://en.wikipedia.org/wiki/Variable-length_quantity)
2. [http://en.wikipedia.org/wiki/Protocol_Buffers](http://en.wikipedia.org/wiki/Protocol_Buffers)

<iframe class="video" width="560" height="315" src="https://www.youtube.com/embed/3qbSGWbu7QQ" frameborder="0" allowfullscreen></iframe>

