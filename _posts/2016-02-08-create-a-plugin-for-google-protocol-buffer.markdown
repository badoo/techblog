---
layout: post
title:  Create a plugin for Google Protocol Buffer
author: Daniele Esposti
date:   2016-02-08
categories: python
---


Google’s [Protocol Buffer](https://developers.google.com/protocol-buffers) is a library to encode and decode messages in a binary format optimised to be compact and portable between different platforms.

At the moment the core library can generate code for C/C++, Java and Python but additional languages can be implemented by writing a plugin for the Protobuf’s compiler.

There is already a [list](https://github.com/google/protobuf/wiki/Third-Party-Add-ons) of plugins that support third party languages, however they  directly translate the .proto files into the target language code, which then makes it possible to add business logic to the generated code.

In my case we wanted to have more control of what we generate and include some logic as well, so we decided to write our code generation plugin.

This post is a simple example of a plugin written in Python, which can be used as starting point for any other Google Protocol Buffer plugin.


## What we’re going to build

In this post we are going to build and understand step by step:

* an interface between our code and the Protobuf compiler
* a parser for `.proto` data structure
* the output of our generated code


## Environment setup

Before start writing the plugin we need to install the Protocol Buffer compiler first to be able to compile any .proto file:

{% highlight sh %}
apt-get install protobuf
{% endhighlight %}

and then the Python [Protobuf](https://pypi.python.org/pypi/protobuf) package to implement our plugin:

{% highlight sh %}
pip install protobuf
{% endhighlight %}


## Writing the plugin

The interface between the `protoc` compiler is pretty simple: the compiler will pass a `CodeGeneratorRequest` message on the stdin and your plugin will output the generated code in a `CodeGeneratorResponse` on the `stdout`. So the first step is to write the code which reads the request and write an empty response:

{% highlight python %}
#!/usr/bin/env python

import sys

from google.protobuf.compiler import plugin_pb2 as plugin


def generate_code(request, response):
    pass


if __name__ == '__main__':
    # Read request message from stdin
    data = sys.stdin.read()

    # Parse request
    request = plugin.CodeGeneratorRequest()
    request.ParseFromString(data)

    # Create response
    response = plugin.CodeGeneratorResponse()

    # Generate code
    generate_code(request, response)

    # Serialise response message
    output = response.SerializeToString()

    # Write to stdout
    sys.stdout.write(output)
{% endhighlight %}

The `protoc` compiler follows a naming convention for the name of the plugins, as state [protobuf-plugin][here] you can save the code above in a file called `protoc-gen-custom` in your `PATH` or save it with any name you prefer (like `my-plugin.py`) and pass the plugin’s name and path to the `--plugin` command line option.

We are choosing the second option - passing the full path of our plugin to the `--plugin` command line option - because it will be much easier to pass a full path to our plugin instead of putting it into the `PATH` and it will make the entire compiler invocation more explicit.

So we’ll save our plugin as `my-plugin.py` and then then compiler’s invocation will looks like this (assuming that the build directory already exists)::

{% highlight sh %}
protoc --plugin=protoc-gen-custom=my-plugin.py --custom_out=./build hello.proto
{% endhighlight %}

The content of `hello.proto` file is simply this:

{% highlight c %}
enum Greeting {
    NONE = 0;
    MR = 1;
    MRS = 2;
    MISS = 3;
}

message Hello {
    required Greeting greeting = 1;
    required string name = 2;
}
{% endhighlight %}

The command above will not generate any output because our plugin does nothing. Now it’s time to write some meaningful output.


## Generating code

Lets modify the `generate_code()` function to generate a JSON representation of the `.proto` file. First we need a function to traverse the AST - the [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of the input `.proto` file -  and return all the enumerators, messages and (nested types)[https://developers.google.com/protocol-buffers/docs/proto#nested):

{% highlight python %}
def traverse(proto_file):

    def _traverse(package, items):
        for item in items:
            yield item, package

            if isinstance(item, DescriptorProto):
                for enum in item.enum_type:
                    yield enum, package

                for nested in item.nested_type:
                    nested_package = package + item.name

                    for nested_item in _traverse(nested, nested_package):
                        yield nested_item, nested_package

    return itertools.chain(
        _traverse(proto_file.package, proto_file.enum_type),
        _traverse(proto_file.package, proto_file.message_type),
    )
{% endhighlight %}

And now the new `generate_code()` function:

{% highlight python %}
import itertools
import json

from google.protobuf.descriptor_pb2 import DescriptorProto, EnumDescriptorProto


def generate_code(request, response):
    for proto_file in request.proto_file:
        output = []

        # Parse request
        for item, package in traverse(proto_file):
            data = {
                'package': proto_file.package or '&lt;root&gt;',
                'filename': proto_file.name,
                'name': item.name,
            }

            if isinstance(item, DescriptorProto):
                data.update({
                    'type': 'Message',
                    'properties': [{'name': f.name, 'type': int(f.type)}
                                   for f in item.field]
                })

            elif isinstance(item, EnumDescriptorProto):
                data.update({
                    'type': 'Enum',
                    'values': [{'name': v.name, 'value': v.number}
                               for v in item.value]
                })

            output.append(data)

        # Fill response
        f = response.file.add()
        f.name = proto_file.name + '.json'
        f.content = json.dumps(output, indent=2)
{% endhighlight %}

For every `.proto` file in the request we iterate over all the items (enumerators, messages and nested types). We store the metadata about any messages and enumerators we encounter during the AST traversal into a dictionary-like data structure which will be used later for generating the output.

We then add a new file to the response and we set the filename. In this case it is equal to the original filename plus the `.json` extension, and the content which is the JSON representation of the dictionary.

If you run again the protobuf compiler it will output a file named `hello.proto.json` in the `build` directory with this content:

{% highlight json %}
[
  {
    "type": "Enum",
    "filename": "hello.proto",
    "values": [
      {
        "name": "NONE",
        "value": 0
      },
      {
        "name": "MR",
        "value": 1
      },
      {
        "name": "MRS",
        "value": 2
      },
      {
        "name": "MISS",
        "value": 3
      }
    ],
    "name": "Greeting",
    "package": "&lt;root&gt;"
  },
  {
    "properties": [
      {
        "type": 14,
        "name": "greeting"
      },
      {
        "type": 9,
        "name": "name"
      }
    ],
    "filename": "hello.proto",
    "type": "Message",
    "name": "Hello",
    "package": "&lt;root&gt;"
  }
]
{% endhighlight %}


## Conclusion

In this post we walked through the creation of a Protocol Buffer plugin to compile a `.proto` file into simplified representation in JSON format. The core being the interface code to read a request from the `stdin`, traverse the AST and write the response on the `stdout`.

The most challenging part was to figure out how the information about the Protobuf data is passed to the plugin and back to the compiler. I was expecting a kind of common data format like JSON or XML instead a custom binary data structure is used instead. This was where I spent most of the time building the first plugin prototype but thanks to the list of plugin examples I was able to understand the plugin/compiler communication.

You are not limited to only transforming the input into another format, you can also use the request to output any code in any language, you can parse a `.proto` file and output code for a RESTful API in Node.js, converting the message and enum definitions into a XML file or even generate another `.proto` file i. e. without the [deprecated](https://developers.google.com/protocol-buffers/docs/proto#options) fields.
