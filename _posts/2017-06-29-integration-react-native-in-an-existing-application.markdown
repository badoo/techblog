---
layout: post
title: Integrating React Native in an existing application
author: Guillermo Orellana
date:   2017-06-30
categories: Android React-Native
excerpt: As I promised at the end of my previous article, "Writing an Android component for React Native”, here is the second approach for React Native and native Android code to live together (not) in peace and harmony and not blow apart.
---
***Updated 11/04/2017: Added some of the API changes and updated the React Native version used in the article***

<img class="no-box-shadow" src="{{page.imgdir}}/7.png"/>


As I promised at the end of my previous article, “<a href="https://techblog.badoo.com/blog/2017/04/24/writing-an-android-component-for-react-native/">Writing an Android component for React Native</a>”, here is the second approach for React Native and native Android code to live together <strike>in peace and harmony</strike> and not blow apart. Since this is a follow-up to the previous article, I will jump straight into the heart of the matter. If you need a brief introduction on React Native and how it’s organised on the Android side, please visit the aforementioned link.

# Getting it to work

After <a href="https://facebook.github.io/react-native/docs/integration-with-existing-apps.html">following the docs sample</a>, you copy the snippets, run the commands… Et voilá! Well… Not really. Actually, the docs do not reflect the current state of the API, which is v0.42.3 when I ~wrote~ updated this paragraph. I will try to expose my issues and the ways I worked around them, but YMMV.

A slightly updated version of the activity showing the React Native content would look like this:

{% highlight Java %}

public class ReactActivity extends AppCompatActivity
    implements DefaultHardwareBackBtnHandler {

    private ReactRootView mReactRootView;
    private ReactInstanceManager mReactInstanceManager;
    private LifecycleState mLifecycleState
        = LifecycleState.BEFORE_RESUME;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mReactRootView = new ReactRootView(this);
        mReactInstanceManager = ReactInstanceManager.builder()
            .setApplication(getApplication())
            .setBundleAssetName("index.android.bundle")
            .setJSMainModuleName("index.android")
            .addPackage(new MainReactPackage())
            .setUseDeveloperSupport(BuildConfig.DEBUG)
            .setInitialLifecycleState(mLifecycleState)
            .build();
        mReactRootView.startReactApplication(mReactInstanceManager,
            "ReactSample", null);

        setContentView(mReactRootView);
    }

    @Override
    protected void onPause() {
        super.onPause();

        mLifecycleState = LifecycleState.BEFORE_RESUME;

        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();

        mLifecycleState = LifecycleState.RESUMED;

        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostResume(this, this);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        mReactRootView.unmountReactApplication();
        mReactRootView = null;

        if (mReactInstanceManager != null) {
            mReactInstanceManager.destroy();
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode,
                                 Intent data) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onActivityResult(this, requestCode,
                resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onBackPressed();
        }
        else {
            super.onBackPressed();
        }
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        super.onBackPressed();
    }
}

{% endhighlight %}

The snippets for ```index.android.js``` and ```package.json``` seem fine for now at least 😎

So, you try to run it but…

# Troubleshooting time

These are the problems I found, but as always, YMMV.

## *java.lang.UnsatisfiedLinkError: could find DSO to load: libreactnativejni.so*

Uh Oh! This sounds scary! What happened here? Well, I decided to test it on a Samsung Galaxy S7 (running Marshmallow, that also will be important in a second or two) … Which happens to be a 64 bit phone. And React Native <a href="https://github.com/facebook/react-native/issues/2814">does not provide a 64bit version of its binary</a>. Usually Android would do a fallback, but this does not happen if you have a 64bit dependency in theory, but in practice I found it happening in a blank modern project.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>
<em>Uh-oh</em>

### Solution

To avoid this, we will have to use some deprecated API in the Gradle plugin in order to tell it to build exclusively for non-64-bit targets.

{% highlight Java %}

ndk {
    abiFilters "armeabi-v7a", "x86"
}

{% endhighlight %}

Did I mention it’s a deprecated API? Android Gradle Plugin will not like it. Just do as the warning says and add ```android.useDeprecatedNdk=true``` in your local ```gradle.properties```.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>
<em>Ugh</em>

### Better solution

There is a better (and not deprecated) way of doing this:

{% highlight Java %}

packagingOptions {
    exclude '/lib/mips64/**'
    exclude '/lib/arm64-v8a/**'
    exclude '/lib/x86_64/**'
}

{% endhighlight %}

This way, you ensure you get rid of the unsupported ABIs, instead of explicitly supporting a few.

So, you hit the “Run” button again and…

## *BadTokenException: Unable to add window – permission denied for this window type*

One very cool thing about developing in React Native is that you get to see the exceptions overlaid on top of your app if you are in debug mode.

One very cool thing about Android Marshmallow is its new permission system, which allows you to take the power back and have a granular control on what you allow your app to do or not.

One very **not cool** thing about our empty app is that we do not request permission to draw over apps, but React Native will attempt to use it anyway, resulting on this beautiful stacktrace.

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>
<em>Unexpected exception</em>

### Solution
A short snippet like this one, carefully placed in ```onCreate```, will quickly ease your pain and show the app overlay permissions dialog instead of randomly crashing each time your app needs  it. You will still have to scroll through the whole list of apps that have that permission and manually enable our lovely React Native by hand, but remember, this is only for debugging. Production apps do not require this permission.

{% highlight Java %}

if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
    if (!Settings.canDrawOverlays(this)) {
        Intent serviceIntent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
        startActivity(serviceIntent);
    }
}

{% endhighlight %}

## Module 0 is not a registered callable module

This one was especially frustrating to get, since every piece of advice I could find was pointing at an outdated React Native version. But that could not be! I was using the *highly discouraged by lint* little + at the end of my Maven coordinates…

{% highlight Java %}

compile "com.facebook.react:react-native:+"  // From node_modules

{% endhighlight %}

So then I tried to change it to match the version I stated in my ```package.json``` file, but hey, this is interesting!

<img class="no-box-shadow" src="{{page.imgdir}}/4.png"/>
<em>Le what?!?</em>

Digging a bit deeper, I found out that *the plus coordinates were pulling an outdated artefact from Maven Central*. Digging even deeper, I found that my local Maven repo to be wrong.

## Solution

Change this

{% highlight Java %}

maven {
    url "$projectDir/node_modules/react-native/android"
}

{% endhighlight %}

To this

{% highlight Java %}

maven {
    url "$projectRoot/node_modules/react-native/android"
}

{% endhighlight %}


Since ```$projectDir``` is referencing the ```app/``` subdirectory. D’oh! 🙈

“This must be it” you naively think. But what happens if you try to open the debug menu?

## android.content.ActivityNotFoundException

So, if you are debugging in a real device and not bundling the JS file, you can shake the phone in order to access the debug menu and…

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>
<em>Thanks for the heads up, logcat</em>

Seriously? AGH!

### Solution

Throw this into your ```<application>``` tag, as our friendly exception suggests. Yep, as simple as that.
<activity
    android:name="com.facebook.react.devsupport.DevSettingsActivity" />


# Result and conclusions

After all these sterling efforts, we finally got an ```Activity``` to launch. Phew! What a long way round! It was definitely not a bed of roses, and some issues did not appear to have an obvious fix after a quick Google search - but hey, maybe that’s just me being bad 🙈

<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>
<em>Hi! You took a long time to appear!</em>

And this is not the end of the road. You will still have to integrate the React Native toolchain into your build process (there is a nice Gradle plugin to help with that, I believe) which adds complexity and build time.

On the other hand, it’s a fair enough way of experimenting on an already existing application without taking the risks that a complete rewrite brings.

But this was too simple, what about interactions between the two sides? I guess I already have a topic for the next React Native themed article… 🤔

As always, code available in <a href="https://github.com/wiyarmir/React-Native-Android-integration-example">GitHub</a>.

*This article was originally published on <a href="https://guillermoorellana.es/react-native/2016/07/05/integrating-react-native-in-an-existing-application.html">Guillermo’s blog</a>.*

**Guillermo Orellana - Android Developer**
