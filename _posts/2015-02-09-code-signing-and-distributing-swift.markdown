---
layout: post
title:  Code signing and distributing - Swift
author: Miguel Angel Quinones
date:   2015-02-09
categories: ios
---

At Badoo we’re slowly adopting the new programming language Apple introduced last year: [Swift](https://www.apple.com/swift/). Even though we don't plan to write Swift-only apps for now, we do want to write isolated modules and learn while we deliver on our products.

Much has been written about the new language and tools, the buggy release and possible performance problems. What haven’t been mentioned so much are the bumps you may encounter as an iOS developer when distributing an application using Swift. This post intends to sum up the issues we encountered and solutions for other developers facing the same problems.

###TL;DR
Be aware of these possible problems:

- If you are signing your application bundle after it is signed by a standard build, you may need to update your scripts. Your app embeds the swift system libraries it uses, and those need to be signed independently.
- If you are distributing your applications using Enterprise certificates, check that they have the organizational unit field present. If they don't, then you need to revoke the certificate and provisioning profile and generate them again.
- If you build your application from CLI, your upload may be rejected, because of a change in how the IPA is structured. The workaround needs [manual scripting](https://github.com/bq/iOS-Scripting-PackageApplication-Swift-Support) on your side.

#Code signing

iOS applications are bundles - folders with .app extension - which contain among other things your assets, and most importantly the executable binary.

When a developer builds for a target other than iOS Simulator, the bundle and its contents are digitally signed using a process called code signing. Code signing is a complex topic, but suffice to say that when you build an application, XCode calls the tool codesign from '/usr/bin/codesign'. Building an iOS application with Swift code, XCode and xcodebuild will already do the heavy lifting for you, and you [generally](http://openradar.appspot.com/18742189) don't need to worry about it.

Mostly any change you do to the bundle or embedded content, will result in the signature being different and the application getting rejected on the OS at run time. This can either be by refusing to install the application, or crashing when loading it. If you want to know more, read [Apple's technote](https://developer.apple.com/library/mac/technotes/tn2206/_index.html).

##Embedded frameworks
After iOS8 and Swift, if your application contains Swift code, it embeds the system frameworks it uses inside your application. That means that inside your .app folder, in iOS there will be a folder called 'Frameworks'. That folder will contain the runtime libraries your application uses from Swift.

That folder will also contain any 3rd party frameworks you include with your application.

##Re-signing your application

As I mentioned, the Xcode toolchain *generally* does all the heavy lifting when code signing, but you may encounter a problem if you do modify the application after it is built and signed by xcodebuild.

If you don't change your scripts you may encounter crashes when running your application in the device. Examples [here](https://www.airsignapp.com/ios-apps-using-swift-crash-when-signed-with-inhouse-certificate/), [here](https://devforums.apple.com/message/1038741) and [here](https://devforums.apple.com/thread/257240?tstart=0).

We're re-signing our applications before distributing enterprise builds, and we had to update our scripts to take into account signing embedded frameworks **before** signing the application:

{% highlight bash %}
# Re-signing embeded dylibs
    if [ -e Payload/*app/Frameworks ]
    then
      pushd Payload/*app/Frameworks
      echo "Copying and re-signing embedded swift libs..."
      SWIFT_LIBS=`find . -name "*dylib"`
      SDK_PATH="/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphoneos/"
      for dylib in $SWIFT_LIBS
      do
        rm "${dylib}"
        cp -v "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/swift/iphoneos/${dylib}" .
        /usr/bin/codesign -f -s "$CERT_NAME" "${dylib}"
      done
      popd
    fi

    /usr/bin/codesign -f -s "$CERT_NAME" Payload/*.app
    zip -qr "$IPA_OUT" Payload
{% endhighlight %}

##Enterprise certificates

Correctly re-signing your application and embedded frameworks may not be enough. We distribute our applications by signing them with an enterprise certificate. When using this certificate and doing the correct signing as described above, the signed frameworks may be rejected by the OS with a [crash](https://www.airsignapp.com/ios-apps-using-swift-crash-when-signed-with-inhouse-certificate/).

It seems that enterprise certificates used to sign embedded runtime libraries, need to contain the **Organizational Unit** field. This was a change possibly introduced around when iOS8 and latest XCode Betas were released. If your certificate was generated before this time, it may not contain that field. This will cause a crash when loading your application in the OS.

The solution is to revoke **both** the certificate and provisioning profiles. When you generate them again, the certificate will have that field and the signature will be accepted by the OS.

#IPA changes

As I have mentioned above, when the application has Swift code, it will embed the runtime libraries into the .app folder. There is another change since iOS8, and that involves how the IPA is structured.

The IPA will also include an additional folder, so your archive will now contain two folders - *Payload* and *SwiftSupport*.

This new *SwiftSupport* folder is generated and added if you build your application from XCode. If you are building your application from command line using xcodebuild to package it, then the created IPA file will not contain that folder. Thus submitting to Apple will result in a rejection with a message:

> "Invalid Swift Support - The bundle contains an invalid implementation of Swift. The app may have been built or signed with non-compliant or pre-release tools."

As of XCode 6.1.1 and XCode 6 Beta4, this problem is always reproducible. See discussion in [Apple developer forums](https://devforums.apple.com/message/1042117#1042117), an [existing bug report](http://openradar.appspot.com/18864315), and [our bug report](http://openradar.appspot.com/radar?id=5293917968793600).

##Work around

So how do you work around this? The solution is simple; Just package the libraries yourself after the archive has been submitted. We happen to use shenzhen to build and archive that project, so this has been fixed already in a pull request. See the example of how it is implemented in [shenzhen](https://github.com/nomad/shenzhen/pull/178). Another example of how to do that with a script [here](https://github.com/bq/iOS-Scripting-PackageApplication-Swift-Support).

#Conclusion

We hope that these clarifications serve as a reference for anybody encountering these problems when distributing applications.

Thank you for reading!
