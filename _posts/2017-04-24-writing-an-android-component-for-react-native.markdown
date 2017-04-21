---
layout: post
title:  Write an Android component for React Native
author: Guillermo Orellana
date:   2017-04-24
categories: Android React-Native
excerpt: React Native has been the buzzword for a while now, but it has recently caught our attention. The main concerns that occurred to us were the size of the existing codebase (let’s say, sizeable), our highly customised classes to fit our needs and easiness of integration. I decided to test the middle one, and try to write a custom Android component to use in React Native.
---
***(Updated 13/04/2017: Bumped to React Native 0.42.3 and updated code)***

<img class="no-box-shadow" src="{{page.imgdir}}/3.png"/>

One of the cool things I like from working at Badoo, is that we are free to propose, test and promote new or different techniques, technologies and libraries. React Native has been the buzzword for a while now, but it has recently caught our attention.

The main concerns that occurred to us were the size of the existing codebase (let’s say, sizeable), our highly customised classes to fit our needs and easiness of integration. I decided to test the middle one, and try to write a custom Android component to use in React Native.

## React Native

Probably almost everybody has already heard about React Native, but if you have not, **TLDR**: it makes use of JavaScript and React but builds a native UI thanks to some clever bridge techniques.

You can learn all about it in the <a href="http://facebook.github.io/react-native/">project page</a>.

If you generate a demo project by invoking **react-native init**, you will get a working skeleton, which is what I will base this post on.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png" titel="Way prettier than your usual Hello World!
"/>

Let’s attempt to extend it by adding a simple **ProgressBar**. This is already implemented as part of the standard React Native distribution, but will serve us as an easy sample.

## Android side
Extensions to the existing bindings are made by implementing the **ReactPackage** class. It can be done in three different ways:

1. Native Modules
They provide an inteface for JavaScript code to call native Java methods. For instance, exposing the Toast API as has been done in the documentation examples.
C++ native modules are provided in a different way, so they can be fully cross-platform.
2. JavaScript Modules
Basically the opposite way around: When you call on a method of a class implementing this interface, the equivalent will be called on the JavaScript realm.
3. ViewManagers
Native views are provided through implementations of the **ViewManager** class, responsible for instantiating and updating views of a given type. This is the one we are interested in for now.

Since we are only setting up a native view component, we will need to go from the ViewManager all the way up through several layers.

<br>

### The ViewManager

All **ViewManager** instances need to report two things: a name to be mapped to a React class, and a way to create an instance of the view they manage. For our **ProgressBar** example, this is quite easy.

{% highlight Java %}

public class ProgressBarViewManager
        extends SimpleViewManager<ProgressBar> {

    public static final String REACT_CLASS = "ProgressBar";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected ProgressBar createViewInstance(
            ThemedReactContext reactContext) {
        return new ProgressBar(reactContext);
    }
}

{% endhighlight %}

Here, **ThemedReactContext** is just a wrapper on top of the Android **Context** we all know (and perhaps hate).
With this done, React Native is able to instantiate a **ProgressBar** each time it finds the JSX tag for it.

<br>

### The Package

At the package level, we do not need to return anything but our brand new **ViewManager**.

{% highlight Java %}

@Override
public List<ViewManager> createViewManagers(
        ReactApplicationContext reactContext) {
    return Collections.<ViewManager>singletonList(
            new ProgressBarViewManager()
    );
}

{% endhighlight %}

The rest of methods can return empty collections safely for now, since we do not need anything from them.

<br>

### The entrypoints: ReactNativeHost

The boilerplate output of **react-native init** generates a subclass of **ReactApplication** (generally **MainApplication**). This wires the native Android calls down to the library. We need to add the new package to the list of packages reported to the JavaScript side, and we are more than done with Java world. This is done in the **getReactNativeHost()** method, but we usually declare a field for it:

{% highlight Java %}

ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
        return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            new ProgressBarPackage()
        );
    }
};

{% endhighlight %}

## JavaScript (React) side

This step is quite simple, since most of it is handled by the React and React Native code. The only thing left for us to do is to describe the propTypes and export the module.

{% highlight Java %}

'use strict';
import {
  NativeModules,
  requireNativeComponent,
  View
} from 'react-native';

var iface = {
  name: 'ProgressBar',
  propTypes: {
    ...View.propTypes // include the default view properties
  },
};

var ProgressBar = requireNativeComponent('ProgressBar', iface);

export default ProgressBar;

{% endhighlight %}


You might be wondering what those default view properties are. Since we inherited **SimpleViewManager** (which extends **BaseViewManager**) when creating our own ViewManager, we can take advantage of that to have all the basic mappings from CSS to View properties solved for us. These include properties such as **opacity**, **backgroundColor** and **flex**. A full list is available <a href="https://facebook.github.io/react-native/docs/view.html">here</a>.

What if we want to expose our own? Well…

## Exposing view properties

On the Java side, we need to create our setters in the ViewManager implementation and annotate them with **@ReactProp**. There we note the name of the property coming from JSX world, and optionally we can define a default value.

{% highlight Java %}

@ReactProp(name = "progress", defaultInt = 0)
public void setProgress(ProgressBar view, int progress) {
    view.setProgress(progress);
}

@ReactProp(name = "indeterminate",
        defaultBoolean = false)
public void setIndeterminate(ProgressBar view,
                             boolean indeterminate) {
    view.setIndeterminate(indeterminate);
}

{% endhighlight %}

This setter will be called every time the property of our React component is updated. In case of the property being removed, then the default value is used.
Then, we need to add it to the React Native interface. Back in the js file, at our module’s iface we should describe the properties we exposed in the ViewManager, both with name and type.

{% highlight Java %}

var iface = {
  // ...
  propTypes: {
    progress: PropTypes.number,
    indeterminate: PropTypes.bool,
  },
  // ...
};

{% endhighlight %}

This way, both Native and React sides will speak in the same terms. In the end, our module’s JS file would look something like this:

{% highlight Java %}

'use strict';

import { PropTypes } from 'react';
import {
  NativeModules,
  requireNativeComponent,
  View
} from 'react-native';

var iface = {
  name: 'ProgressBar',
  propTypes: {
    progress: PropTypes.number,
    indeterminate: PropTypes.bool,
    ...View.propTypes // include the default view properties
  },
};

var ProgressBar = requireNativeComponent('ProgressBar', iface);

export default ProgressBar;

{% endhighlight %}

## All together

Kickstart the **react-native** server, deploy the APK to your favourite emulator or real device, and if nothing is missing the million-gear machine will produce something that looks more or less like this.

<img class="no-box-shadow" src="{{page.imgdir}}/2.gif" title="They see me rolling..."/>

## Aftermath

React Native, more than a year after its public release (and not even one year after the Android release), is in a way more mature state than the last time I attempted anything on it. You can have a working boilerplate project with one command. Docs are very helpful and community content is great.

However, it still feels very cumbersome to integrate it with complex modules.

There is, nevertheless, an alternative approach. Instead of having a brand new React Native application adopt Native components, there is the possibility of doing the complete opposite - having a mature production application integrate one simple React Native component.

From reading the docs, it looks more complicated than it sounds, and I have some concerns about the build process - speed and reliability. But that’s food for another thought, and most likely another post. Stay tuned!

## Links

<a href="https://github.com/wiyarmir/React-Native-Android-component-example">GitHub repo with the final code</a>

*This article was originally published on <a href="https://guillermoorellana.es/react-native/2016/06/12/writing-android-component-for-react-native.html">Guillermo's blog</a>.*

**Guillermo Orellana - Android Developer**
