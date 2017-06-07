---
layout: post
title: Reactive selfies with Camera2 API on Android - Part 1
author: Arkady Gamza
date:   2017-06-07
categories: Android RXJava
excerpt: I will show an example of Camera2 API usage, which at present has been poorly documented and studied by the community. We’ll be using RXJava2 to tame this API. The second version of this popular library came out relatively recently, and not many examples are available.
---

<img class="no-box-shadow" src="{{page.imgdir}}/1.png">

As you probably know, RxJava is good for solving two problems: processing event streams and working with asynchronous methods. In a previous article (<a href="https://techblog.badoo.com/blog/2016/06/23/shake-detector-for-android-with-rxjava/">Shake Detector for Android with RxJava</a>), I showed you how to build an operator chain to process an event stream from a sensor. In this article, I want to demonstrate how RxJava can be applied to work with an existing asynchronous API.  I’ve chosen Camera2 API as an example of this type of API.

I will show an example of Camera2 API usage, which at present has been poorly documented and studied by the community. We’ll be using RXJava2 to tame this API. The second version of this popular library came out relatively recently, and not many examples are available.

So, who is this article for? I’m assuming that the reader is a smart, experienced and inquisitive Android developer. Basic knowledge of reactive programming is highly desirable (you’ll find a good introduction from Jake Wharton <a href="https://www.youtube.com/watch?v=htIXKI5gOQU">here</a>) as well as the ability to understand Marble Diagrams. This article will be useful for those of you desiring to get into using a reactive approach, as well as those who want to use Camera2 API in their projects. I warn you in advance that there will be a lot of code!

You can access the project source code on <a href="https://github.com/ArkadyGamza/Camera2API_rxJava2">GitHub</a>.

# Project preparation

Let’s add external dependencies to our project.

## Retrolambda
As always, work with RxJava necessitates lambda support, otherwise the code will look awful, so (if you’ve moved on to Android Studio 3.0) we’ll add Retrolambda to our project.

{% highlight Java %}

buildscript {
 	dependencies {
  	classpath 'me.tatarka:gradle-retrolambda:3.6.0'
   }
}

apply plugin: 'me.tatarka.retrolambda'

{% endhighlight %}

Now we can raise the version to 8, which will give us lambda support:

{% highlight Java %}

android {
  compileOptions {
	sourceCompatibility JavaVersion.VERSION_1_8
	targetCompatibility JavaVersion.VERSION_1_8
  }
}

{% endhighlight %}

Full instructions can be found <a href="https://github.com/evant/gradle-retrolambda">here</a>.

## RxJava2

{% highlight java %}

compile "io.reactivex.rxjava2:rxjava:2.1.0"

{% endhighlight %}

For the current version, full instructions and documentation check <a href="https://github.com/ReactiveX/RxJava">here</a>.

## RxAndroid
This is a useful library when using <a href="https://github.com/ReactiveX/RxAndroid">RxJava on Android</a>. It is generally used for AndroidSchedulers.

{% highlight java %}

compile 'io.reactivex.rxjava2:rxandroid:2.0.1'

{% endhighlight %}

# Camera2 API

Some time ago I was involved in a Code Review of a feature written using Camera1 API and was unpleasantly surprised with its unavoidable API concurrency issues. It’s clear that Google have also recognised the problem and deprecated the first version of the API. As an alternative, they suggest using Camera2 API. The second version is available for Android Lollipop and newer versions.

Let’s take a look at it <a href="https://developer.android.com/reference/android/hardware/camera2/package-summary.html">here</a>.

## First impressions

Google has worked hard on mistakes relating to organising threads. All operations are carried out asynchronously, with notifications coming via callbacks. In particular, you can choose the thread in which the callback method sent to the corresponding Handler will be called. As always, working with subsequent asynchronous calls used in this API can quickly descend into Callback Hell.

## Reference implementation

Google suggests this example for a <a href="https://github.com/googlesamples/android-Camera2Basic">camera2-basic</a> application.

This is a fairly simple example, but will help us come to terms with the API. Let’s look at whether we can create a more elegant solution using a reactive approach.

## Steps for takinga photo

In short, this is the sequence of actions required to take a photo:

- Choose device
- Open device
- Open session
- Launch preview
- Take a photo by pressing the button
- Close session
- Close device

## Choose device

The first thing we need is <a href="https://developer.android.com/reference/android/hardware/camera2/CameraManager.html">CameraManager</a>.

{% highlight Java %}

mCameraManager = (CameraManager) mContext.getSystemService(Context.CAMERA_SERVICE);

{% endhighlight %}

This class enables us to receive information on cameras within the system. There may be several cameras, with smartphones usually having two - front and rear.

Let’s obtain a list of cameras:

{% highlight Java %}

String[] cameraIdList = manager.getCameraIdList();

{% endhighlight %}

So, it’s just a list of string IDs.
Now let’s get a list of characteristics for each camera:

{% highlight Java %}

for (String cameraId : cameraIdList) {
  CameraCharacteristics characteristics = mCameraManager.getCameraCharacteristics(cameraId);
...
}

{% endhighlight %}

<a href="https://developer.android.com/reference/android/hardware/camera2/CameraCharacteristics.html">CameraCharacteristics</a> contains a huge number of keys which can be used to obtain information about the camera.

Most commonly at this stage of the camera choice, they look at where the camera is directed. For this we need to obtain the value for the key CameraCharacteristics.LENS_FACING:

{% highlight java %}

Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);

{% endhighlight %}

Cameras may be front (CameraCharacteristics.LENS_FACING_FRONT), rear (CameraCharacteristics.LENS_FACING_BACK) or external (CameraCharacteristics.LENS_FACING_EXTERNAL).

The camera selection function with orientation preferences can look a little like this:

{% highlight Java %}

@Nullable
private static String getCameraWithFacing(@NonNull CameraManager manager, int lensFacing) throws CameraAccessException {
    String possibleCandidate = null;
    String[] cameraIdList = manager.getCameraIdList();
    if (cameraIdList.length == 0) {
        return null;
    }
    for (String cameraId : cameraIdList) {
        CameraCharacteristics characteristics = manager.getCameraCharacteristics(cameraId);

        StreamConfigurationMap map = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
        if (map == null) {
            continue;
        }

        Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);
        if (facing != null && facing == lensFacing) {
            return cameraId;
        }

        //just in case device don't have any camera with given facing
        possibleCandidate = cameraId;
    }
    if (possibleCandidate != null) {
        return possibleCandidate;
    }
    return cameraIdList[0];
}

{% endhighlight %}

Excellent, now we have an ID for the camera with the required orientation (or any other, if the one we need is not found). Everything’s still pretty simple, and there are no asynchronous actions.

## Let’s create Observable

Now we come to the asynchronous API methods.  Each of them may be turned into an Observable using the create method.

### openCamera

Prior to use, we need to open the device with the help of the <a href="https://developer.android.com/reference/android/hardware/camera2/CameraManager.html#openCamera(java.lang.String,%20android.hardware.camera2.CameraDevice.StateCallback,%20android.os.Handler)">CameraManager.openCamera</a> method.

void openCamera (String cameraId,
           	CameraDevice.StateCallback callback,
           	Handler handler)

In this method, we transfer the chosen camera’s ID to the callback so that it can receive the asynchronous result; and Handler if we want the callback method to be called in the thread of this Handler.  

This is where we come across the first asynchronous method.  It’s understandable, as the initialisation of the device is a long and costly process.

Let’s take a look at <a href="https://developer.android.com/reference/android/hardware/camera2/CameraDevice.StateCallback.html">CameraDevice.StateCallback</a>.

<img class="no-box-shadow" src="{{page.imgdir}}/2.png">

In the reactive world, these methods will correspond to events. Let’s create an Observable which will emit an event when the camera API calls callbacks onOpened, onClosed and onDisconnected. To distinguish these events, we create enum:

{% highlight java %}

public enum DeviceStateEvents {
  ON_OPENED,
  ON_CLOSED,
  ON_DISCONNECTED
}

{% endhighlight %}

For the reactive stream (from here on in, I’ll call the reactive stream the sequence of reactive operators) to be able to do anything with the device, we’ll add a link to CameraDevice in the emitted event. The simplest method is to emit Pair<DeviceStateEvents, CameraDevice>. To create an Observable, we’ll use the create method (remember we’re using RxJava2, so now this isn’t a completely shameful action).

Here is the signature of the create method:

{% highlight java %}

public static <T> Observable<T> create(ObservableOnSubscribe<T> source)

{% endhighlight %}

This means that we need to pass the object implementing ObservableOnSubscribe<T> interface. This interface only contains one method:

{% highlight java %}

void subscribe(@NonNull ObservableEmitter<T> e) throws Exception;

{% endhighlight %}

which is called every time Observer subscribes to our Observable. Let’s look at what ObservableEmitter is:

{% highlight java %}

public interface ObservableEmitter<T> extends Emitter<T> {
  void setDisposable(@Nullable Disposable d);
  void setCancellable(@Nullable Cancellable c);
  boolean isDisposed();
  ObservableEmitter<T> serialize();
}

{% endhighlight %}

It’s already looking useful. Using the methods setDisposable/setCancellable you can set an action which will be carried out when our Observable signs off. This is extremely useful if we open a resource, during the creation of an Observable, which we need to close. We could have created a Disposable to close the device on unsubscribe, but we want to react to the event onClosed, so we won’t do this.
The isDisposed method allows us to check whether anything else is subscribed to our Observable.

Take note that the interface named ObservableEmitter expands the Emitter interface:

{% highlight java %}

public interface Emitter<T> {
  void onNext(@NonNull T value);
  void onError(@NonNull Throwable error);
  void onComplete();
}

{% endhighlight %}

These are the methods we need!  We’ll call onNext each time Camera API calls the callbacks <a href="https://developer.android.com/reference/android/hardware/camera2/CameraDevice.StateCallback.html">CameraDevice.StateCallback</a> onOpened / onClosed / onDisconnected; and we’ll call onError when Camera API calls the onError callback.

So, let’s apply our knowledge. The method creating an Observable can look something like this (for reader simplification I’ve removed verifications for isDisposed(). For the full code with boring checks look at GitHub):

{% highlight java %}

public static Observable<Pair<DeviceStateEvents, CameraDevice>> openCamera(
    @NonNull String cameraId,
    @NonNull CameraManager cameraManager
) {
    return Observable.create(observableEmitter -> {
       	cameraManager.openCamera(cameraId, new CameraDevice.StateCallback() {
        	@Override
        	public void onOpened(@NonNull CameraDevice cameraDevice) {
                    observableEmitter.onNext(new Pair<>(DeviceStateEvents.ON_OPENED, cameraDevice));
        	}

        	@Override
        	public void onClosed(@NonNull CameraDevice cameraDevice) {
                    observableEmitter.onNext(new Pair<>(DeviceStateEvents.ON_CLOSED, cameraDevice));
                    observableEmitter.onComplete();
        	}

        	@Override
            public void onDisconnected(@NonNull CameraDevice cameraDevice) {
                    observableEmitter.onNext(new Pair<>(DeviceStateEvents.ON_DISCONNECTED, cameraDevice));
                    observableEmitter.onComplete();
      	  }

        	@Override
        	public void onError(@NonNull CameraDevice camera, int error) {
                    observableEmitter.onError(new OpenCameraException(OpenCameraException.Reason.getReason(error)));
        	}
        }, null);
    });
}

{% endhighlight %}

Great, we’ve just become a little more reactive!

As I’ve already said, all methods for Camera2 API accept Handler as one of the parameters. In transferring null, we’ll get callbacks called in the current thread. In our case, this is the thread in which subscribe was called, which is Main Thread.

### createCaptureSession

Now that we have a CameraDevice, we can open CaptureSession. So, without further ado, let’s continue.
For this, we’ll use the method <a href="https://developer.android.com/reference/android/hardware/camera2/CameraDevice.html#createCaptureSession(java.util.List%3Candroid.view.Surface%3E,%20android.hardware.camera2.CameraCaptureSession.StateCallback,%20android.os.Handler)">CameraDevice.createCaptureSession</a>.
Here’s the signature:

{% highlight java %}

void createCaptureSession(
  @NonNull List<Surface> outputs,
  @NonNull CameraCaptureSession.StateCallback callback,
  @Nullable Handler handler) throws CameraAccessException;

{% endhighlight %}

On entry, the Surface list is given (we’ll look at where to get this from later) as well as <a href="https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.StateCallback.html">CameraCaptureSession.StateCallback</a>. Let’s examine the methods it contains:

<img class="no-box-shadow" src="{{page.imgdir}}/3.png">

Yes, it’s rich. However, we already know how to conquer the callbacks!  We’ll create an Observable, which will emit an event when Camera API calls these methods. To distinguish them, we’ll create enum:

{% highlight java %}

public enum CaptureSessionStateEvents {
  ON_CONFIGURED,
  ON_READY,
  ON_ACTIVE,
  ON_CLOSED,
  ON_SURFACE_PREPARED
}

{% endhighlight %}

So that CameraCaptureSession is within the reactive stream, we’ll generate not just CaptureSessionStateEvent, but Pair<CaptureSessionStateEvents, CameraCaptureSession>. So, this is what a method creating such an Observable can look like (again, the verifications are removed to make it easier to read):

{% highlight java %}

@NonNull
public static Observable<Pair<CaptureSessionStateEvents, CameraCaptureSession>> createCaptureSession(
    @NonNull CameraDevice cameraDevice,
    @NonNull List<Surface> surfaceList
) {
    return Observable.create(observableEmitter -> {
        cameraDevice.createCaptureSession(surfaceList, new CameraCaptureSession.StateCallback() {

        	@Override
        	public void onConfigured(@NonNull CameraCaptureSession session) {
                    observableEmitter.onNext(new Pair<>(CaptureSessionStateEvents.ON_CONFIGURED, session));
          	}

        	@Override
        	public void onConfigureFailed(@NonNull CameraCaptureSession session) {
                    observableEmitter.onError(new CreateCaptureSessionException(session));
        	}

        	@Override
        	public void onReady(@NonNull CameraCaptureSession session) {
                    observableEmitter.onNext(new Pair<>(CaptureSessionStateEvents.ON_READY, session));
        	}

        	@Override
        	public void onActive(@NonNull CameraCaptureSession session) {
                    observableEmitter.onNext(new Pair<>(CaptureSessionStateEvents.ON_ACTIVE, session));
        	}

        	@Override
        	public void onClosed(@NonNull CameraCaptureSession session) {
                    observableEmitter.onNext(new Pair<>(CaptureSessionStateEvents.ON_CLOSED, session));
                    observableEmitter.onComplete();
      	  }

        	@Override
        	public void onSurfacePrepared(@NonNull CameraCaptureSession session, @NonNull Surface surface) {
                    observableEmitter.onNext(new Pair<>(CaptureSessionStateEvents.ON_SURFACE_PREPARED, session));
        	}
        }, null);
    });
}

{% endhighlight %}

### setRepeatingRequest

For a live picture from the camera to appear on the screen, we need to constantly receive new images from the device and send them for display. There’s a convenient method in the API for this <a href="https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.html#setRepeatingRequest(android.hardware.camera2.CaptureRequest,%20android.hardware.camera2.CameraCaptureSession.CaptureCallback,%20android.os.Handler)">CameraCaptureSession.setRepeatingRequest</a>:

{% highlight java %}

int setRepeatingRequest(@NonNull CaptureRequest request,
            @Nullable CaptureCallback listener, @Nullable Handler handler)
            throws CameraAccessException;

{% endhighlight %}

We’ll apply an approach that is already known to make the operation reactive.
Let’s take a look at: <a href="https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.CaptureCallback.html">https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.CaptureCallback.html</a>

<img class="no-box-shadow" src="{{page.imgdir}}/4.png">

Again, we want to distinguish the events generated, so let’s create enum

{% highlight java %}

public enum CaptureSessionEvents {
  ON_STARTED,
  ON_PROGRESSED,
  ON_COMPLETED,
  ON_SEQUENCE_COMPLETED,
  ON_SEQUENCE_ABORTED
}

{% endhighlight %}

Also, we see that a large amount of information is sent to the methods, which we want to include in the reactive stream, including CameraCaptureSession, CaptureRequest and CaptureResult. As simply using Pair won’t suit, we’ll create a POJO:

{% highlight java %}

public static class CaptureSessionData {
  final CaptureSessionEvents event;
  final CameraCaptureSession session;
  final CaptureRequest request;
  final CaptureResult result;

  CaptureSessionData(CaptureSessionEvents event, CameraCaptureSession session, CaptureRequest request, CaptureResult result) {
      this.event = event;
      this.session = session;
      this.request = request;
      this.result = result;
  }
}

{% endhighlight %}

We’ll transfer creation of CameraCaptureSession.CaptureCallback into a separate method:

{% highlight java %}

@NonNull
private static CameraCaptureSession.CaptureCallback createCaptureCallback(final ObservableEmitter<CaptureSessionData> observableEmitter) {
  return new CameraCaptureSession.CaptureCallback() {

      @Override
      public void onCaptureStarted(@NonNull CameraCaptureSession session, @NonNull CaptureRequest request, long timestamp, long frameNumber) {
      }

      @Override
      public void onCaptureProgressed(@NonNull CameraCaptureSession session, @NonNull CaptureRequest request, @NonNull CaptureResult partialResult) {
      }

      @Override
      public void onCaptureCompleted(@NonNull CameraCaptureSession session, @NonNull CaptureRequest request, @NonNull TotalCaptureResult result) {
      	if (!observableEmitter.isDisposed()) {
              observableEmitter.onNext(new CaptureSessionData(CaptureSessionEvents.ON_COMPLETED, session, request, result));
      	}
      }

      @Override
      public void onCaptureFailed(@NonNull CameraCaptureSession session, @NonNull CaptureRequest request, @NonNull CaptureFailure failure) {
          if (!observableEmitter.isDisposed()) {
              observableEmitter.onError(new CameraCaptureFailedException(failure));
      	}
      }

      @Override
      public void onCaptureSequenceCompleted(@NonNull CameraCaptureSession session, int sequenceId, long frameNumber) {
      }

      @Override
      public void onCaptureSequenceAborted(@NonNull CameraCaptureSession session, int sequenceId) {
      }
  };
}

{% endhighlight %}

From all these messages, we’re interested in onCaptureCompleted/onCaptureFailed, and we’ll ignore the rest. If you need them for your project, it’s not hard to add them.

Now everything’s ready, so we can create an Observable:

{% highlight java %}

static Observable<CaptureSessionData> fromSetRepeatingRequest(@NonNull CameraCaptureSession captureSession, @NonNull CaptureRequest request) {
        return Observable
            .create(observableEmitter -> captureSession.setRepeatingRequest(request, createCaptureCallback(observableEmitter), null));
}

{% endhighlight %}

### capture

In fact, this step is essentially the same as the previous one. However, we’re carrying this out not through repeating the request, but individually. For this, we’ll use the method: <a href="https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.html#capture(android.hardware.camera2.CaptureRequest, android.hardware.camera2.CameraCaptureSession.CaptureCallback, android.os.Handler)">CameraCaptureSession.capture</a>.

int capture (<a href="https://developer.android.com/reference/android/hardware/camera2/CaptureRequest.html">CaptureRequest</a> request,
           	 <a href="https://developer.android.com/reference/android/hardware/camera2/CameraCaptureSession.CaptureCallback.html">CameraCaptureSession.CaptureCallback</a> listener,
           	 <a href="https://developer.android.com/reference/android/os/Handler.html">Handler</a> handler)

It applies exactly the same parameters, so we can use the function defined above to create CaptureCallback

{% highlight java %}

static Observable<CaptureSessionData> fromCapture(@NonNull CameraCaptureSession captureSession, @NonNull CaptureRequest request) {
    	return Observable
        	.create(observableEmitter -> captureSession.capture(request, createCaptureCallback(observableEmitter), null));
}

{% endhighlight %}

## Preparation for Surface

Camera2 API enables the Surface list to be transmitted in the request. These Surfaces will receive the data from the device. We need 2 Surfaces:

- For displaying a preview on the screen
- For writing the image to a jpeg file

### TextureView

To display the preview on the screen we’ll use <a href="https://developer.android.com/reference/android/view/TextureView.html">TextureView</a>. To receive Surface from TextureView, they suggest using the following method: <a href="https://developer.android.com/reference/android/view/TextureView.html#setSurfaceTextureListener(android.view.TextureView.SurfaceTextureListener)">TextureView.setSurfaceTextureListener</a>.

void setSurfaceTextureListener (<a href="https://developer.android.com/reference/android/view/TextureView.SurfaceTextureListener.html">TextureView.SurfaceTextureListener</a> listener)

TextureView notifies the listener when Surface is ready for use.

This time, let’s create PublishSubject, which will generate the events when TextureView calls the listener methods:

{% highlight java %}

private final PublishSubject<SurfaceTexture> mOnSurfaceTextureAvailable = PublishSubject.create();

@Override
public void onCreate(@Nullable Bundle saveState){

    mTextureView.setSurfaceTextureListener(new TextureView.SurfaceTextureListener(){
        @Override
        public void onSurfaceTextureAvailable(SurfaceTexture surface,int width,int height){
           mOnSurfaceTextureAvailable.onNext(surface);
        }
    });
    ...
}

{% endhighlight %}

In using PublishSubject, we avoid potential problems with multiple subscribe. We’ll set SurfaceTextureListener in onCreate just once and live peacefully ever afterwards. PublishSubject can be subscribed to as many times as is necessary, passing the events to all subscribers.

<img class="no-box-shadow" src="{{page.imgdir}}/5.png">

One specific flaw in using Camera2 API is that you cannot explicitly set the size of the image. The camera chooses one of the supported resolutions based on the size of the Surface sent to it. This means that the following trick is needed: we get the list of image sizes supported by the camera, choose the most suitable one and then set the buffer size according to this information.

{% highlight java %}

private void setupSurface(@NonNull SurfaceTexture surfaceTexture) {
        surfaceTexture.setDefaultBufferSize(mCameraParams.previewSize.getWidth(), mCameraParams.previewSize.getHeight());
    	mSurface = new Surface(surfaceTexture);
}

{% endhighlight %}

If we want to save proportions, we need to set the TextureView’s aspect ratio. For this we’ll override the onMeasure method.

{% highlight java %}

public class AutoFitTextureView extends TextureView {

    private int mRatioWidth = 0;
    private int mRatioHeight = 0;
...

    public void setAspectRatio(int width, int height) {
        mRatioWidth = width;
        mRatioHeight = height;
        requestLayout();
	}

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width = MeasureSpec.getSize(widthMeasureSpec);
        int height = MeasureSpec.getSize(heightMeasureSpec);
        if (0 == mRatioWidth || 0 == mRatioHeight) {
            setMeasuredDimension(width, height);
        } else {
            if (width < height * mRatioWidth / mRatioHeight) {
            	setMeasuredDimension(width, width * mRatioHeight / mRatioWidth);
            } else {
            	setMeasuredDimension(height * mRatioWidth / mRatioHeight, height);
            }
        }
    }
}

{% endhighlight %}


### Writing to file

To save an image from Surface to the file we’ll use the <a href="https://developer.android.com/reference/android/media/ImageReader.html">ImageReader</a> class.

A few words on choosing the size for ImageReader. Firstly, we need to choose this from the list of those supported by the camera. Secondly, the aspect ratio must match that chosen for preview.

To get notification from ImageReader concerning the image being ready, we’ll use the method:

<a href="https://developer.android.com/reference/android/media/ImageReader.html#setOnImageAvailableListener(android.media.ImageReader.OnImageAvailableListener, android.os.Handler)">ImageReader.setOnImageAvailableListener</a>

{% highlight java %}

void setOnImageAvailableListener (ImageReader.OnImageAvailableListener listener,
                Handler handler)

{% endhighlight %}

The listener transmitted has exactly 1 method:

{% highlight java %}

void onImageAvailable (ImageReader reader)

{% endhighlight %}

Each time Camera API records an image to Surface, supplied by our ImageReader, it will induce this callback.

Let’s make this operation reactive: we’ll create an Observable, which will emit an event each time ImageReader is ready to supply an image:

{% highlight java %}

@NonNull
public static Observable<ImageReader> createOnImageAvailableObservable(@NonNull ImageReader imageReader) {
    return Observable.create(subscriber -> {

        ImageReader.OnImageAvailableListener listener = reader -> {
            if (!subscriber.isDisposed()) {
                subscriber.onNext(reader);
            }
        };
        imageReader.setOnImageAvailableListener(listener, null);
        subscriber.setCancellable(() -> imageReader.setOnImageAvailableListener(null, null)); //remove listener on unsubscribe
    });
}

{% endhighlight %}

Take note that we’re using the ObservableEmitter.setCancellable method to delete the listener when Observable is being unsubscribed.

Saving to the file is a long operation, so let’s make this reactive using the fromCallable method:

{% highlight java %}

@NonNull
public static Single<File> save(@NonNull Image image, @NonNull File file) {
        return Single.fromCallable(() -> {
            try (FileChannel output = new FileOutputStream(file).getChannel()) {
                output.write(image.getPlanes()[0].getBuffer());
            	return file;
            }
            finally {
            	image.close();
            }
        });
}

{% endhighlight %}

Now we can set up this sequence of actions: when a ready image appears in ImageReader, we’ll save it the Schedulers.io() thread, then switch to the UI thread and notify the UI that the file is ready:

{% highlight java %}

private void initImageReader() {
    Size sizeForImageReader = CameraStrategy.getStillImageSize(mCameraParams.cameraCharacteristics, mCameraParams.previewSize);
    mImageReader = ImageReader.newInstance(sizeForImageReader.getWidth(), sizeForImageReader.getHeight(), ImageFormat.JPEG, 1);
    mCompositeDisposable.add(
        ImageSaverRxWrapper.createOnImageAvailableObservable(mImageReader)
            .observeOn(Schedulers.io())
            .flatMap(imageReader -> ImageSaverRxWrapper.save(imageReader.acquireLatestImage(), mFile).toObservable())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(file -> mCallback.onPhotoTaken(file.getAbsolutePath(), getLensFacingPhotoType()))
    );
}

{% endhighlight %}

## Launching preview

So, now we’re basically ready! We can already create Observable for basic asynchronous actions, which are required for the application to work. Now for the most interesting moment - configuring the reactive streams.

As a warm-up let’s make the camera open after SurfaceTexture is ready for use:

{% highlight java %}

Observable<Pair<CameraRxWrapper.DeviceStateEvents, CameraDevice>> cameraDeviceObservable = mOnSurfaceTextureAvailable
  .firstElement()
  .doAfterSuccess(this::setupSurface)
  .doAfterSuccess(__ -> initImageReader())
  .toObservable()
  .flatMap(__ -> CameraRxWrapper.openCamera(mCameraParams.cameraId, mCameraManager))
  .share();

{% endhighlight %}

The key operator here is **flatMap**

<img class="no-box-shadow" src="{{page.imgdir}}/6.png">

In our case, on receiving an event concerning SurfaceTexture being ready, the openCamera function will be executed and emit the events from the created Observable further into the reactive stream.

It’s also important to understand why we use the **share** operator at the end of the chain. This operator is equivalent to the publish().refCount() operator chain.

<img class="no-box-shadow" src="{{page.imgdir}}/7.png">

If you look at this marble diagram for a long time, you’ll notice that the result is very similar to using PublishSubject. Indeed, we’re solving a similar problem - if our Observable is subscribed to several times, we don’t want to open the camera again every time.

Let’s introduce another couple of Observables for convenience.

{% highlight java %}

Observable<CameraDevice> openCameraObservable = cameraDeviceObservable
    .filter(pair -> pair.first == CameraRxWrapper.DeviceStateEvents.ON_OPENED)
    .map(pair -> pair.second)
    .share();

Observable<CameraDevice> closeCameraObservable = cameraDeviceObservable
    .filter(pair -> pair.first == CameraRxWrapper.DeviceStateEvents.ON_CLOSED)
    .map(pair -> pair.second)
    .share();

{% endhighlight %}

openCameraObservable will emit an event when the camera successfully opens, and closeCameraObservable will emit an event when the camera closes.

Let’s put in one more step: after the camera has successfully opened, we’ll open the session

{% highlight java %}

Observable<Pair<CameraRxWrapper.CaptureSessionStateEvents, CameraCaptureSession>> createCaptureSessionObservable = openCameraObservable
    .flatMap(cameraDevice -> CameraRxWrapper
        .createCaptureSession(cameraDevice, Arrays.asList(mSurface, mImageReader.getSurface()))
    )
    .share();

{% endhighlight %}

In a similar fashion, let’s create another couple of Observables to signal that the session has been successfully opened or closed.

{% highlight java %}

Observable<CameraCaptureSession> captureSessionConfiguredObservable = createCaptureSessionObservable
    .filter(pair -> pair.first == CameraRxWrapper.CaptureSessionStateEvents.ON_CONFIGURED)
    .map(pair -> pair.second)
    .share();

Observable<CameraCaptureSession> captureSessionClosedObservable = createCaptureSessionObservable
    .filter(pair -> pair.first == CameraRxWrapper.CaptureSessionStateEvents.ON_CLOSED)
    .map(pair -> pair.second)
    .share();

{% endhighlight %}

Finally, we can send a repeated request to display a preview:

{% highlight java %}

Observable<CaptureSessionData> previewObservable = captureSessionConfiguredObservable
    .flatMap(cameraCaptureSession -> {
    	CaptureRequest.Builder previewBuilder = createPreviewBuilder(cameraCaptureSession, mSurface);
    	return CameraRxWrapper.fromSetRepeatingRequest(cameraCaptureSession, previewBuilder.build());
    })
    .share();

{% endhighlight %}

Now it’s enough to run

{% highlight java %}

previewObservable.subscribe()

{% endhighlight %}

and a live picture from the camera appears on the screen!

A little variation. If we inline all the intermediate Observables, we’ll get the following chain of operators.

{% highlight java %}

mOnSurfaceTextureAvailable
    .firstElement()
    .doAfterSuccess(this::setupSurface)
    .toObservable()
    .flatMap(__ -> CameraRxWrapper.openCamera(mCameraParams.cameraId, mCameraManager))
    .filter(pair -> pair.first == CameraRxWrapper.DeviceStateEvents.ON_OPENED)
    .map(pair -> pair.second)
    .flatMap(cameraDevice -> CameraRxWrapper
        .createCaptureSession(cameraDevice, Arrays.asList(mSurface, mImageReader.getSurface()))
    )
    .filter(pair -> pair.first == CameraRxWrapper.CaptureSessionStateEvents.ON_CONFIGURED)
    .map(pair -> pair.second)
    .flatMap(cameraCaptureSession -> {
    	CaptureRequest.Builder previewBuilder = createPreviewBuilder(cameraCaptureSession, mSurface);
    	return CameraRxWrapper.fromSetRepeatingRequest(cameraCaptureSession, previewBuilder.build());
    })
    .subscribe();

{% endhighlight %}

This is enough to show the preview. Impressive, right?

Speaking frankly, this solution has issues with closing resources, and so we can’t actually take a photo yet. I’ve brought this up so that the full chain can be seen. All intermediate Observables are required for the creation of more complex scenarios of behaviour for the future.

For us to be able to sign off, we need to save the Disposable returned by the subscribe method. The easiest way is to use CompositeDisposable:

{% highlight java %}

private final CompositeDisposable mCompositeDisposable = new CompositeDisposable();

private void unsubscribe() {
    mCompositeDisposable.clear();
}

{% endhighlight %}

In the real code, I’ve added mCompositeDisposable.add(...subscribe()) everywhere, but I’ve left this out in the article to make it easier to read.

## How to create CaptureRequest requests

Attentive readers have of course already noticed that we are using the createPreviewBuilder method, which we haven’t described yet.  Let’s take a look at what’s inside:

{% highlight java %}

 @NonNull
CaptureRequest.Builder createPreviewBuilder(CameraCaptureSession captureSession, Surface previewSurface) throws CameraAccessException {
    CaptureRequest.Builder builder = captureSession.getDevice().createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
    builder.addTarget(previewSurface);
    setup3Auto(builder);
    return builder;
}

{% endhighlight %}

Here we can use the request template for preview provided by the Camera2 API, add our Surface and tell it that we want Auto Focus, Auto Exposure and Auto White Balance (three A). To achieve this, all we need to do is set up several flags:

{% highlight java %}

private void setup3Auto(CaptureRequest.Builder builder) {
    // Enable auto-magical 3A run by camera device
    builder.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO);

    Float minFocusDist = mCameraParams.cameraCharacteristics.get(CameraCharacteristics.LENS_INFO_MINIMUM_FOCUS_DISTANCE);

    // If MINIMUM_FOCUS_DISTANCE is 0, lens is fixed-focus and we need to skip the AF run.
    boolean noAFRun = (minFocusDist == null || minFocusDist == 0);

    if (!noAFRun) {
        // If there is a "continuous picture" mode available, use it, otherwise default to AUTO.
        int[] afModes = mCameraParams.cameraCharacteristics.get(CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES);
        if (contains(afModes, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE)) {
            builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
        }
        else {
            builder.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_AUTO);
        }
    }

    // If there is an auto-magical flash control mode available, use it, otherwise default to
    // the "on" mode, which is guaranteed to always be available.
    int[] aeModes = mCameraParams.cameraCharacteristics.get(CameraCharacteristics.CONTROL_AE_AVAILABLE_MODES);
    if (contains(aeModes, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH)) {
        builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON_AUTO_FLASH);
    }
    else {
        builder.set(CaptureRequest.CONTROL_AE_MODE, CaptureRequest.CONTROL_AE_MODE_ON);
    }

    // If there is an auto-magical white balance control mode available, use it.
    int[] awbModes = mCameraParams.cameraCharacteristics.get(CameraCharacteristics.CONTROL_AWB_AVAILABLE_MODES);
    if (contains(awbModes, CaptureRequest.CONTROL_AWB_MODE_AUTO)) {
        // Allow AWB to run auto-magically if this device supports this
        builder.set(CaptureRequest.CONTROL_AWB_MODE, CaptureRequest.CONTROL_AWB_MODE_AUTO);
    }
}

{% endhighlight %}

## Taking a photo

To get an event on pressing the camera button, we can use this great library <a href="https://github.com/JakeWharton/RxBinding">https://github.com/JakeWharton/RxBinding</a>, but we’ll simplify things a little bit:

{% highlight java %}

private final PublishSubject<Object> mOnShutterClick = PublishSubject.create();

public void takePhoto() {
  mOnShutterClick.onNext(this);
}

{% endhighlight %}

Now let’s outline the plan of action. First and foremost, we want to take a picture when preview has already started, which means everything is ready to go. For this, we’ll use the operator combineLatest:

{% highlight java %}

Observable.combineLatest(previewObservable, mOnShutterClick, (captureSessionData, o) -> captureSessionData)

{% endhighlight %}

However, this will generate events constantly on receiving fresh data from previewObservable, so let’s limit it to the first event:

{% highlight java %}

  .firstElement().toObservable()

{% endhighlight %}

We’ll wait while autofocus and autoexposure do their work:

{% highlight java %}

  .flatMap(this::waitForAf)
  .flatMap(this::waitForAe)

{% endhighlight %}

Finally, let’s take a photo:

{% highlight java %}

  .flatMap(captureSessionData -> captureStillPicture(captureSessionData.session))

{% endhighlight %}

The full operator sequence is:

{% highlight java %}

Observable.combineLatest(previewObservable, mOnShutterClick, (captureSessionData, o) -> captureSessionData)
	.firstElement().toObservable()
	.flatMap(this::waitForAf)
	.flatMap(this::waitForAe)
	.flatMap(captureSessionData -> captureStillPicture(captureSessionData.session))
	.subscribe(__ -> {
	}, this::onError)

{% endhighlight %}

Let’s look at what’s inside captureStillPicture:

{% highlight java %}

@NonNull
private Observable<CaptureSessionData> captureStillPicture(@NonNull CameraCaptureSession cameraCaptureSession) {
    return Observable
        .fromCallable(() -> createStillPictureBuilder(cameraCaptureSession.getDevice()))
        .flatMap(builder -> CameraRxWrapper.fromCapture(cameraCaptureSession, builder.build()));
}

{% endhighlight %}

All of this here sounds familiar - we create a request, launch capture and wait for the result.
The request is constructed from the STILL_PICTURE template, and we add Surface for saving in the file as well as a few magic flags which tell the camera that this is the important request to save the image. Information is also given concerning the orientation of the image in the jpeg file.

{% highlight java %}

@NonNull
private CaptureRequest.Builder createStillPictureBuilder(@NonNull CameraDevice cameraDevice) throws CameraAccessException {
    final CaptureRequest.Builder builder;
    builder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE);
    builder.set(CaptureRequest.CONTROL_CAPTURE_INTENT, CaptureRequest.CONTROL_CAPTURE_INTENT_STILL_CAPTURE);
    builder.set(CaptureRequest.CONTROL_AE_PRECAPTURE_TRIGGER, CameraMetadata.CONTROL_AE_PRECAPTURE_TRIGGER_IDLE);
    builder.addTarget(mImageReader.getSurface());
    setup3Auto(builder);

    int rotation = mWindowManager.getDefaultDisplay().getRotation();
    builder.set(CaptureRequest.JPEG_ORIENTATION, CameraOrientationHelper.getJpegOrientation(mCameraParams.cameraCharacteristics, rotation));
    return builder;
}

{% endhighlight %}

## Closing resources

Good applications always close resources, especially demanding ones, such as a camera device. Let’s close everything after the onPause event:

{% highlight java %}

Observable.combineLatest(previewObservable, mOnPauseSubject, (state, o) -> state)
    .firstElement().toObservable()
    .doOnNext(captureSessionData -> captureSessionData.session.close())
    .flatMap(__ -> captureSessionClosedObservable)
    .doOnNext(cameraCaptureSession -> cameraCaptureSession.getDevice().close())
    .flatMap(__ -> closeCameraObservable)
    .doOnNext(__ -> closeImageReader())
    .subscribe(__ -> unsubscribe(), this::onError);

{% endhighlight %}

Here, we are successively closing the session and the device pending confirmation from the API.

# Conclusions

We created an application in this article which can show a live preview picture and take photos. We have a fully working camera application. The only aspect we haven’t covered is waiting for autofocus to function, automatic exposure selection and choosing the file orientation. You’ll get the answers to these issues in part two of this article.

In RxJava, developers have been given a powerful tool for controlling asynchronous APIs. With competent use, you can avoid Callback Hell and get a clean code, that is easy to read and to maintain. Share your opinions in the comment section!

You can access the project source code on <a href="https://github.com/ArkadyGamza/Camera2API_rxJava2">GitHub</a>.

**Arkady Gamza, Android developer**
