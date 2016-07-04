---
layout: post
title:  Shake Detector for Android with RxJava
author: Arkady Gamza
date:   2016-06-23
categories: Android RxJava
excerpt: It all began when I had the task of undoing a user action in the app when the device was shaken. The main problem was how to know that a shake had occurred. After a couple of minutes of searching, it became clear that one should subscribe to accelerometer events and then somehow try to detect shakes.
---
It all began when I had the task of undoing a user action in the app when the device was shaken. The main problem was how to know that a shake had occurred. After a couple of minutes of searching, it became clear that one should subscribe to accelerometer events and then somehow try to detect shakes.
Of course, there were some ready-made solutions for that. They were all quite similar, but none of them suited me so I wrote my own implementation. This was a class that subscribed to sensor events and changed its state with every event. After that, my colleagues and I fine-tuned the solution to avoid false positives, but as a result it began to look like something from a “Mad Max” movie. I promised that I would rewrite this mess when I had free time.

Recently I was reading articles about RxJava and remembered that task. Hmm, I thought, RxJava looks like a perfect tool for such a problem. Without thinking twice, I wrote a solution using RxJava. I was impressed by the result - the whole logic was only 8 (eight) lines of code! I decided to share my experience with other developers, and that’s how this article was born.

I hope that this simple example will help you decide whether to use RxJava in your projects. I will first explain how to setup the Android project with RxJava and then go through the development of a sample application step-by-step, explaining all the operators used. I am writing from the perspective that people reading this will have some experience with Android development itself, so the focus will be on using reactive programming.

The source code of the finished application is available on  <a href="https://github.com/ArkadyGamza/ShakeDetector" target="_blank">GitHub</a>.

Let’s start!

## Project setup

### Adding RxJava dependency

To use RxJava, we should add these line to the build.gradle:

{% highlight groovy %}

dependencies {
    ...
    compile 'io.reactivex:rxjava:1.1.3'
    compile 'io.reactivex:rxandroid:1.1.0'
}

{% endhighlight %}
*N.B: rxAndroid provides a Scheduler, which is bound to the UI thread.*

### Adding Lambdas support
RxJava is best when backed up with Lambdas. Without Lambdas, there is a lot of boilerplate code. There are two ways of adding Lambda support at the moment: using the Jack compiler from Android N Developer Preview or using the Retrolambda library. In both cases we should check that JDK 8 is installed first. I used Retrolambda in this example.

**Android N Developer Preview**

To use the Jack compiler from Android N Developer Preview, we can follow <a href="https://developer.android.com/preview/j8-jack.html" target="_blank">these instructions</a>.

Add these lines to build.gradle:

{% highlight groovy %}

android {
  ...
  defaultConfig {
    ...
    jackOptions {
      enabled true
    }
  }
  compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
}

{% endhighlight %}

**Retrolambda**

To add the Retrolambda library to the project there are instructions by Evan Tatarka at <a href="https://github.com/evant/gradle-retrolambda" target="_blank">https://github.com/evant/gradle-retrolambda</a>

{% highlight groovy %}

buildscript {
  ...
  dependencies {
     classpath 'me.tatarka:gradle-retrolambda:3.2.5'
  }
}

apply plugin: 'com.android.application'
apply plugin: 'me.tatarka.retrolambda'

android {
  compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
}

{% endhighlight %}

*N.B: Please note that in the original instructions Maven Central repository is recommended. You probably already have the JCenter repo in your project since it is used by default when a project is created by Android Studio. JCenter already contains all the required dependencies, so we should not add Maven Central.*

## Observable

So now we have all the tools, we can start development.

When you use RxJava, it all starts with getting an <a href="http://reactivex.io/documentation/observable.html" target="_blank"> Observable</a>.
Let’s create a factory class that will create an Observable subscribed to sensor events, with the help of the <a href="http://reactivex.io/documentation/operators/create.html" target="_blank">Observable.create</a> method:

{% highlight java %}

public class SensorEventObservableFactory {
   public static Observable<SensorEvent> createSensorEventObservable(@NonNull Sensor sensor, @NonNull SensorManager sensorManager) {
       return Observable.create(subscriber -> {
           MainThreadSubscription.verifyMainThread();

           SensorEventListener listener = new SensorEventListener() {
               @Override
               public void onSensorChanged(SensorEvent event) {
                   if (subscriber.isUnsubscribed()) {
                       return;
                   }

                   subscriber.onNext(event);
               }

               @Override
               public void onAccuracyChanged(Sensor sensor, int accuracy) {
                   // NO-OP
               }
           };

           sensorManager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_GAME);

           // unregister listener in main thread when being unsubscribed
           subscriber.add(new MainThreadSubscription() {
               @Override
               protected void onUnsubscribe() {
                   sensorManager.unregisterListener(listener);
               }
           });
       });
   }
}

{% endhighlight %}

Now we have a tool to transform events emitted by any sensor into an Observable. But which sensor fits our task best? In the screenshot below, the first plot is showing values from the gravity sensor <a href="https://developer.android.com/reference/android/hardware/Sensor.html#TYPE_GRAVITY" target="_blank">TYPE_GRAVITY</a>, the second plot - <a href="https://developer.android.com/reference/android/hardware/Sensor.html#TYPE_ACCELEROMETER" target="_blank">TYPE_ACCELEROMETER</a>, the third plot - <a href="https://developer.android.com/reference/android/hardware/Sensor.html#TYPE_LINEAR_ACCELERATION" target="_blank">TYPE_LINEAR_ACCELERATION</a>.
<br>
As you can see, the device was rotated smoothly and then shaken.

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

We are interested in events emitted by the sensor with type Sensor.TYPE_LINEAR_ACCELERATION. They contain acceleration values with Earth gravity already subtracted.

{% highlight java %}

@NonNull
private static Observable<SensorEvent> createAccelerationObservable(@NonNull Context context) {
   SensorManager mSensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
   List<Sensor> sensorList = mSensorManager.getSensorList(Sensor.TYPE_LINEAR_ACCELERATION);
   if (sensorList == null || sensorList.isEmpty()) {
       throw new IllegalStateException("Device has no linear acceleration sensor");
   }

   return SensorEventObservableFactory.createSensorEventObservable(sensorList.get(0), mSensorManager);
}

{% endhighlight %}

## Reactive magic

Now that we have an Observable with acceleration events, we can use all the power of RxJava operators.

Let’s check what “raw” values look like:

{% highlight java %}

createAccelerationObservable(context)
  .subscribe(event -> Log.d(TAG, formatTime(event) + " " + Arrays.toString(event.values)));

{% endhighlight %}

This will produce output:

{% highlight java %}

29.398 [0.0016835928, 0.014868498, 0.0038280487]
29.418 [-0.026405454, -0.017675579, 0.024353027]
29.438 [-0.032944083, -0.0029007196, 0.011956215]
29.458 [0.03226435, 0.022876084, 0.032211304]
29.478 [-0.0011371374, 0.022291958, -0.054023743]

{% endhighlight %}



As you can see, we have an event emitted by the sensor every 20ms. This frequency corresponds to the SensorManager.SENSOR_DELAY_GAME value passed as a samplingPeriodUs parameter when SensorEventListener was registered.

As a payload, we have acceleration values for all three axes but we’ll only use the X-axis projection values. They correspond to the gesture we want to detect. Some solutions use values from all three axes, so they trigger when the device is put on the table, for example (there is a significant acceleration for the Z axis when the device meets the table surface).

Let’s create a data class with only the necessary fields:

{% highlight java %}

private static class XEvent {
   public final long timestamp;
   public final float x;

   private XEvent(long timestamp, float x) {
       this.timestamp = timestamp;
       this.x = x;
   }
}

{% endhighlight %}

Convert SensorEvent into XEvent and filter events with an acceleration absolute value exceeding some threshold:

{% highlight java %}

createAccelerationObservable(context)
   .map(sensorEvent -> new XEvent(sensorEvent.timestamp, sensorEvent.values[0]))
   .filter(xEvent -> Math.abs(xEvent.x) > THRESHOLD)
   .subscribe(xEvent -> Log.d(TAG, formatMsg(xEvent)));

{% endhighlight %}

Now, to see some messages in the log we need to shake the device for the first time.

It’s really funny to see someone debugging the Shake Detection - they are constantly shaking their phone. You can only imagine what comes to my mind.

{% highlight java %}

55.347 19.030302
55.367 13.084376
55.388 -15.775546
55.408 -14.443999

{% endhighlight %}

We only have events with significant acceleration values for the X axis in the log.

Now the most interesting part begins. We need to track the moments when acceleration changes to the opposite direction. Let’s try to understand when this happens. Imagine that a hand with a phone is being accelerated to the left; the acceleration projection on the X axis has a negative sign. Then the hand begins to slow its motion and stops, the acceleration projection on the X axis has a positive sign. It means that one shake corresponds to one sign change of acceleration projection.
Let’s form a so-called “sliding window”: actually it’s just a buffer that contains two values, the current one and a previous one:

{% highlight java %}

  createAccelerationObservable(context)
           .map(sensorEvent -> new XEvent(sensorEvent.timestamp, sensorEvent.values[0]))
           .filter(xEvent -> Math.abs(xEvent.x) > THRESHOLD)
           .buffer(2, 1)
           .subscribe(buf -> Log.d(TAG, getLogMsg(buf)));

{% endhighlight %}

And here’s our log:

{% highlight java %}

[43.977 -15.497713; 44.017 21.000145]
[44.017 21.000145; 44.037 19.947767]
[44.037 19.947767; 44.057 19.836182]
[44.057 19.836182; 44.077 20.659754]
[44.077 20.659754; 44.098 -16.811298]
[44.098 -16.811298; 44.118 -15.6345]

{% endhighlight %}

Excellent, as we can see each event is now grouped with the previous one. We can easily filter couples of events with a different sign.

{% highlight java %}

       createAccelerationObservable(context)
           .map(sensorEvent -> new XEvent(sensorEvent.timestamp, sensorEvent.values[0]))
           .filter(xEvent -> Math.abs(xEvent.x) > THRESHOLD)
           .buffer(2, 1)
           .filter(buf -> buf.get(0).x * buf.get(1).x < 0)
           .subscribe(buf -> Log.d(TAG, getLogMsg(buf)));

{% endhighlight %}
<br>
{% highlight java %}

[53.888 -16.762777; 53.928 20.83315]
[53.988 19.87952; 54.028 -16.735554]
[54.089 -16.46596; 54.109 21.682497]
[54.169 20.355597; 54.209 -16.634022]
[54.269 -16.122211; 54.309 21.806463]

{% endhighlight %}

Now every event corresponds to one shake. Only 4 operators are used and we can already detect rapid moves! But false triggering is still possible. Say the user was not shaking his device intentionally, but just took it in the other hand. There is a simple solution to avoid that - ask the user to shake the device several times during a short time period.
Let’s introduce the parameters SHAKES_COUNT = number of shakes and SHAKES_PERIOD = the amount of time all shakes are to be made in. I have figured out that optimal values for these parameters are 3 shakes in 1 second. In other cases, some false triggering is possible or the user has to shake the device too hard.

So we want to detect the case when 3 shakes have been done within 1 second. Now we don’t need the values of acceleration, only the timestamp of each event is important. Let’s transform our buffered XEvents into timestamps of the last event in the buffer:

{% highlight java %}

.map(buf -> buf.get(1).timestamp / 1000000000f)

{% endhighlight %}

The timestamp values in SensorEvent are in nanoseconds (really, really precise!), so I divide the value by 10^9 to get seconds.
Now let’s apply again the familiar trick with a sliding window but this time with different params:

{% highlight java %}

.buffer(SHAKES_COUNT, 1).

{% endhighlight %}

In other words, for each event we’ll have an array containing that event along with two previous events.
And, finally, we’ll filter only arrays that fit into 1 second:

{% highlight java %}

.filter(buf -> buf.get(SHAKES_COUNT - 1) - buf.get(0) < SHAKES_PERIOD)

{% endhighlight %}

If an event has passed the last filter we know the user has shaken their device 3 times during 1 second.
But let’s assume our dear user is over enthusiastic in shaking the device and continues to shakes it diligently. We will receive events on every subsequent shake, but want to detect only every 3 shakes. A simple solution for that is ignoring events for SHAKES_PERIOD after gesture detection:

{% highlight java %}

.throttleFirst(SHAKES_PERIOD, TimeUnit.SECONDS)

{% endhighlight %}

It’s done! This Observable can now be used in our app. Here is the final code snippet:

{% highlight java %}

public class ShakeDetector {

   public static final int THRESHOLD = 13;
   public static final int SHAKES_COUNT = 3;
   public static final int SHAKES_PERIOD = 1;

   @NonNull
   public static Observable<?> create(@NonNull Context context) {
       return createAccelerationObservable(context)
           .map(sensorEvent -> new XEvent(sensorEvent.timestamp, sensorEvent.values[0]))
           .filter(xEvent -> Math.abs(xEvent.x) > THRESHOLD)
           .buffer(2, 1)
           .filter(buf -> buf.get(0).x * buf.get(1).x < 0)
           .map(buf -> buf.get(1).timestamp / 1000000000f)
           .buffer(SHAKES_COUNT, 1)
           .filter(buf -> buf.get(SHAKES_COUNT - 1) - buf.get(0) < SHAKES_PERIOD)
           .throttleFirst(SHAKES_PERIOD, TimeUnit.SECONDS);
   }

   @NonNull
   private static Observable<SensorEvent> createAccelerationObservable(@NonNull Context context) {
       SensorManager mSensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
       List<Sensor> sensorList = mSensorManager.getSensorList(Sensor.TYPE_LINEAR_ACCELERATION);
       if (sensorList == null || sensorList.isEmpty()) {
           throw new IllegalStateException("Device has no linear acceleration sensor");
       }

       return SensorEventObservableFactory.createSensorEventObservable(sensorList.get(0), mSensorManager);
   }

   private static class XEvent {
       public final long timestamp;
       public final float x;

       private XEvent(long timestamp, float x) {
           this.timestamp = timestamp;
           this.x = x;
       }
   }
}

{% endhighlight %}

## Usage

In my example I play a sound when a shake gesture is detected.
Let’s add a field in the Activity class:

{% highlight java %}

private Observable<?> mShakeObservable;

{% endhighlight %}

Initialise it in the onCreate method:

{% highlight java %}

@Override
protected void onCreate(Bundle savedInstanceState) {
   super.onCreate(savedInstanceState);
   setContentView(R.layout.activity_main);
   mShakeObservable = ShakeDetector.create(this);
}

{% endhighlight %}

Subscribe to the onResume method:

{% highlight java %}

@Override
protected void onResume() {
   super.onResume();
   mShakeSubscription = mShakeObservable.subscribe((object) -> Utils.beep());
}

{% endhighlight %}

And don’t forget to unsubscribe in onPause:

{% highlight java %}

@Override
protected void onPause() {
   super.onPause();
   mShakeSubscription.unsubscribe();
}

{% endhighlight %}

That’s it!

## Conclusion

As you can see, we were able to create a solution in just a few lines of code that detects a given shake gesture. It is compact and easy to read and understand. You can compare this with regular solutions, e.g. <a href="https://github.com/square/seismic" target="_blank">seismic</a> by Jake Wharton.
RxJava is a great tool and when properly applied great results can be achieved. I hope this article will give you the impulse to learn RxJava and use reactive principles in your projects.

Let the <a href="https://stackoverflow.com" target="_blank">stackoverflow.com</a> be with you!

**Arkady Gamza, Android developer.**
