---
layout: post
title:  Masking Bitmaps on Android
author: Arkady Gamza
date:   2016-10-17
categories: Android
excerpt: In this article, I would like to analyse the tools available for Android developers which can be used to complete such tasks — and choose the most efficient of them.
---

<img class="no-box-shadow" src="{{page.imgdir}}/1.png"/>

The problem of image masking often comes up in Android development. Rounded image corners or rounded images are required most of all. Yet sometimes even more complex image masks are used.

In this article, I would like to analyse the tools available for Android developers which can be used to complete such tasks — and choose the most efficient of them.

My article will be mainly useful to those who need to mask an image manually, without using third-party libraries. I also assume that if you are reading this, you already have experience in Android development and are familiar with Canvas, Drawable and Bitmap classes.

The code used in this article can be found on <a href="https://github.com/ArkadyGamza/MaskingBitmaps" target="_blank"> GitHub</a>. So let’s get started!

# Task description

Suppose we have two images represented by Bitmap objects. The first one includes an original image and the  the second one contains a mask stored in its alpha channel. We need to display the image overlaid with the mask.

# Loading of images

First of all, the images should be loaded into the memory: for example, the procedure for resources loading looks as follows:

{% highlight java %}

private void loadImages() {
        mPictureBitmap = BitmapFactory.decodeResource(getResources(), R.drawable.picture);
        mMaskBitmap = BitmapFactory.decodeResource(getResources(), R.drawable.mask_circle).extractAlpha();
    }

{% endhighlight %}

Pay attention to the .extractAlpha(), the call creating Bitmap with ALPHA_8 configuration, which means that each pixel is stored as one byte of memory representing its transparency. This format is very useful to efficiently store masks because we don’t need their colour information and therefore we don’t have to store it.

Once the images are loaded, we can proceed to the most interesting part: **overlaying the mask**. What methods could be used to do this?

# PorterDuff Modes

One of the solutions proposed is to use the Porter-Duff image overlay modes on the Canvas. Let's refresh our memories what it is about.

## Theory

Introduction to the notation (according to the standard <a href="https://www.w3.org/TR/2002/WD-SVG11-20020215/masking.html" target="_blank"> https://www.w3.org/TR/2002/WD-SVG11-20020215/masking.html</a>):
<br/>Da (destination alpha) — canvas pixel transparency before image overlaying
<br/>Dc (destination colour) — canvas pixel colour before image overlaying
<br/>Sa (source alpha) — overlay image pixel transparency
<br/>Sc (source colour) — overlay image pixel colour
<br/>Da' — canvas pixel transparency after image overlaying
<br/>Dc’ — canvas pixel colour after image overlaying

The mode shall be determined by the rule that defines Da' and Dc' depending on Dc, Da, Sa, Sc.
<br/>Thus, we obtain four parameters per each pixel. The formula by which these four parameters turn into the final image pixel colour and transparency is the description of the overlay mode.

[Da’, Dc’] = f(Dc, Da, Sa, Sc)

<br/>For example, the formula for DST_IN mode looks like this:
<br/>Da' = Sa·Da
<br/>Dc' = Sa·Dc
<br/>Or its compact version [Da’, Dc’] = [Sa·Da, Sa·Dc].
<br/>In Android documentation it looks like:
<img class="no-box-shadow" src="{{page.imgdir}}/1 bis.png" style="float:none; margin:0"/>


Now I can provide a link to some excessively concise <a href="https://developer.android.com/reference/android/graphics/PorterDuff.Mode.html" target="_blank"> documentation from Google</a>.
<br/>Without prior explanation, developers looking at it are often bewildered.
<br/>In fact, thinking about what the final image will look like when using these formulas is quite tedious. It is much more convenient to use the following overlay mode crib:

<img class="no-box-shadow" src="{{page.imgdir}}/2.png"/>

It’s obvious now that we want to use SRC_IN or DST_IN modes. They are, in fact, an intersection of nontransparent areas on the canvas and overlaid image.
DST_IN mode  retains the canvas colour while SRC_IN mode  alters it. If the image was originally drawn on the canvas, select DST_IN mode. If the mask was originally drawn on the canvas, select SRC_IN mode.

Now that everything is more clear, we can start writing the code.

## SRC_IN

At <a href="http://stackoverflow.com/" target="_blank"> stackoverflow.com</a>, people often recommend allocating buffer memory when using PorterDuff modes, and even worse  allocating memory at each onDraw call. Of course, this is quite inefficient. You should try to avoid allocating buffer memory from the heap at onDraw calls altogether. Moreover, it make no sense to use there the Bitmap.createBitmap call,  because this can easily require several megabytes of memory. A simple example — a 640*640 ARGB_8888 image takes more than 1.5 megabytes of memory.

To avoid this, the buffer can be allocated in advance and then reused for onDraw calls.
Here’s an example of Drawable, which uses SRC_IN mode,  and where the buffer memory is allocated only when the size of the Drawable is changed:

{% highlight java %}

public class MaskedDrawablePorterDuffSrcIn extends Drawable {

  private Bitmap mPictureBitmap;
  private Bitmap mMaskBitmap;
  private Bitmap mBufferBitmap;
  private Canvas mBufferCanvas;
  private final Paint mPaintSrcIn = new Paint();

  public MaskedDrawablePorterDuffSrcIn() {
      mPaintSrcIn.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
  }

  public void setPictureBitmap(Bitmap pictureBitmap) {
      mPictureBitmap = pictureBitmap;
  }

  public void setMaskBitmap(Bitmap maskBitmap) {
      mMaskBitmap = maskBitmap;
  }

  @Override
  protected void onBoundsChange(Rect bounds) {
      super.onBoundsChange(bounds);
      final int width = bounds.width();
      final int height = bounds.height();

      if (width <= 0 || height <= 0) {
          return;
      }

      mBufferBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);        mBufferCanvas = new Canvas(mBufferBitmap);
  }

  @Override
  public void draw(Canvas canvas) {
      if (mPictureBitmap == null || mMaskBitmap == null) {
          return;
      }

      mBufferCanvas.drawBitmap(mMaskBitmap, 0, 0, null);
      mBufferCanvas.drawBitmap(mPictureBitmap, 0, 0, mPaintSrcIn);

      //dump the buffer
      canvas.drawBitmap(mBufferBitmap, 0, 0, null);
  }

{% endhighlight %}

The example above has the mask drawn first on the buffer canvas, and then the image is drawn in SRC_IN mode.

You will see that code above is inefficient.  It’s possible to redraw the buffer canvas only when something has changed, not on every draw call.
<br/>Here is the optimised code:

{% highlight java %}

public class MaskedDrawablePorterDuffSrcIn extends MaskedDrawable {

   private Bitmap mPictureBitmap;
   private Bitmap mMaskBitmap;
   private Bitmap mBufferBitmap;
   private Canvas mBufferCanvas;
   private final Paint mPaintSrcIn = new Paint();

   public static MaskedDrawableFactory getFactory() {
       return new MaskedDrawableFactory() {
           @Override
           public MaskedDrawable createMaskedDrawable() {
               return new MaskedDrawablePorterDuffSrcIn();
           }
       };
   }

   public MaskedDrawablePorterDuffSrcIn() {
       mPaintSrcIn.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
   }

   @Override
   public void setPictureBitmap(Bitmap pictureBitmap) {
       mPictureBitmap = pictureBitmap;
       redrawBufferCanvas();
   }

   @Override
   public void setMaskBitmap(Bitmap maskBitmap) {
       mMaskBitmap = maskBitmap;
       redrawBufferCanvas();
   }

   @Override
   protected void onBoundsChange(Rect bounds) {
       super.onBoundsChange(bounds);
       final int width = bounds.width();
       final int height = bounds.height();

       if (width <= 0 || height <= 0) {
           return;
       }

       if (mBufferBitmap != null
           && mBufferBitmap.getWidth() == width
           && mBufferBitmap.getHeight() == height) {
           return;
       }

       mBufferBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888); //that's too bad
       mBufferCanvas = new Canvas(mBufferBitmap);
       redrawBufferCanvas();
   }

   private void redrawBufferCanvas() {
       if (mPictureBitmap == null || mMaskBitmap == null || mBufferCanvas == null) {
           return;
       }

       mBufferCanvas.drawBitmap(mMaskBitmap, 0, 0, null);
       mBufferCanvas.drawBitmap(mPictureBitmap, 0, 0, mPaintSrcIn);
   }

   @Override
   public void draw(Canvas canvas) {
       //dump the buffer
       canvas.drawBitmap(mBufferBitmap, 0, 0, null);
   }

   @Override
   public void setAlpha(int alpha) {
       mPaintSrcIn.setAlpha(alpha);
   }

   @Override
   public void setColorFilter(ColorFilter cf) {
       //Not implemented
   }

   @Override
   public int getOpacity() {
       return PixelFormat.UNKNOWN;
   }

   @Override
   public int getIntrinsicWidth() {
       return mMaskBitmap != null ? mMaskBitmap.getWidth() : super.getIntrinsicWidth();
   }

   @Override
   public int getIntrinsicHeight() {
       return mMaskBitmap != null ? mMaskBitmap.getHeight() : super.getIntrinsicHeight();
   }
}

{% endhighlight %}

## DST_IN

Unlike SRC_IN, the DST_IN mode requires the order of the drawing to be changed (i.e: the image is drawn first on the canvas, and then the mask goes on top.
Compared to the previous example, the changes would look like this:

{% highlight java %}

mPaintDstIn.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_IN));

mBufferCanvas.drawBitmap(mPictureBitmap, 0, 0, null);
mBufferCanvas.drawBitmap(mMaskBitmap, 0, 0, mPaintDstIn);

{% endhighlight %}

It’s a little bit weird, you will tell me! But if the mask is presented in ALPHA_8 format, this code will not provide  the expected result. If the mask is presented in an inefficient ARGB_8888 format, everything is fine.
<br/>The question at <a href="http://stackoverflow.com/questions/38552580/android-porterduff-mode-dst-in-combined-with-bitmap-config-alpha-8" target="_blank">stackoverflow.com</a> remains unanswered.
<br/>If any of you know the reason, please, share it with me in the comments section.

## CLEAR + DST_OVER

In the examples above, buffer memory was allocated only when the Drawable size was changed, which is already much better than allocating with each draw call.
<br/>But in certain conditions we can do without any buffer memory allocation, drawing directly on the canvas, which was passed to the draw method.
<br/>In this case, we must remember that something was already drawn on the canvas before a call to our drawable draw is made.

To avoid memory allocation, one could use the CLEAR mode to crop a kind of  mask-shaped hole, and then use DST_OVER mode to draw a picture — it’s like putting the picture under the canvas. The picture can be seen through this hole, and the effect is just what we need.

The description makes it clear that such a trick can be used when it is known that the mask and the image do not contain any semi-transparent areas: **only fully transparent** or **fully opaque pixels**.

The code will look like this:

{% highlight java %}

mPaintDstOver.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_OVER));
mPaintClear.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));

//draw the mask with clear mode
canvas.drawBitmap(mMaskBitmap, 0, 0, mPaintClear);

//draw picture with dst over mode
canvas.drawBitmap(mPictureBitmap, 0, 0, mPaintDstOver);

{% endhighlight %}

But this solution has a transparency problem. If we would like to implement the setAlpha method, we have a problem where the window background is seen through the image and not what was painted on the canvas in our Drawable.
<br/>Compare these images:

<table>
        <tr>
            <td><img src="{{page.imgdir}}/3.png" alt="" /></td>
            <td><img src="{{page.imgdir}}/4.png" alt="" /></td>
        </tr>
</table>


The left image shows the desired output, and the right one displays the actual result of combining CLEAR + DST_OVER with semi-transparency.

As you can see, the use of PorterDuff modes for  Android results in either excessive memory allocation or limited applicability. Fortunately, there is a way to avoid all of these problems: just use **BitmapShader**.

# BitmapShader

Usually, when shaders are mentioned, OpenGL is the first thing that comes to mind. But there is no need to worry here  because  BitmapShader for the Android does not require the developer to be knowledgeable in this area. In fact, the implementations of android.graphics.Shader describe an algorithm that determines the colour of each pixel, that is, they are pixel shaders.

### How should we use them?

It’s very simple: if we load the shader into Paint, it will take the each pixel colour from the shader when used for drawing. The package includes shader implementations for drawing gradients, combining other shaders, and (the most useful for our task) BitmapShader, which is initialised with a Bitmap. This shader returns the colour of the corresponding pixels from the Bitmap which was provided during initialisation.

The documentation contains an important note — you can draw anything with the shader, except for a Bitmap. In fact, however, if a Bitmap has ALPHA_8 format, drawing of a Bitmap using a shader works fine. Our mask has just the same format, so let's try to display the mask with a shader that uses the flower image.

Let's do this step by step:

1. Create BitmapShader, and load the flower image into it.
2. Create Paint, and set our BitmapShader to it.
3. Draw a mask using the Paint.

{% highlight java %}

public void setPictureBitmap(Bitmap src) {
  mPictureBitmap = src;
  mBitmapShader = new BitmapShader(mPictureBitmap,
      Shader.TileMode.REPEAT,
      Shader.TileMode.REPEAT);
  mPaintShader.setShader(mBitmapShader);
}

public void draw(Canvas canvas) {
  if (mPaintShader == null || mMaskBitmap == null) {
      return;
  }
  canvas.drawBitmap(mMaskBitmap, 0, 0, mPaintShader);
}

{% endhighlight %}

Since the shader can be used to draw anything, you can try to draw text with it, for example:

{% highlight java %}

public void setPictureBitmap(Bitmap src) {
  mPictureBitmap = src;
  mBitmapShader = new BitmapShader(mPictureBitmap,
      Shader.TileMode.REPEAT,
      Shader.TileMode.REPEAT);
  mPaintShader.setShader(mBitmapShader);

  mPaintShader.setTextSize(getIntrinsicHeight());
  mPaintShader.setStyle(Paint.Style.FILL);
  mPaintShader.setTextAlign(Paint.Align.CENTER);
  mPaintShader.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
}

@Override
public void draw(Canvas canvas) {
  if (mPictureBitmap == null) {
      return;
  }
  canvas.drawText("A", getIntrinsicWidth() / 2, getIntrinsicHeight() * 0.9f, mPaintShader);
}

{% endhighlight %}

**The result looks like this:**

<img class="no-box-shadow" src="{{page.imgdir}}/5.png"/>

# RoundedBitmapDrawable

It is good to know  that there’s a RoundedBitmapDrawable class in the Support Library. It can be useful, if you only need to round the corners of an image or make an image completely rounded. The implementation uses BitmapShader.

# Performance

Let's see how the methods listed above affect performance.
<br/>For this, I used RecyclerView with 100 elements. GPU monitor graphs were taken at fast scrolling on a sufficiently fast smartphone (Moto X Style).
<br/>The X-axis is for time, and Y-axis is for the number of milliseconds each frame took to draw. Ideally the graph should remain under the green line, which corresponds to 60 FPS.

<img class="no-box-shadow" src="{{page.imgdir}}/6.png"/>
<em>Plain BitmapDrawable (no masking)</em>

<img class="no-box-shadow" src="{{page.imgdir}}/7.png"/>
<em>SRC_IN</em>

<img class="no-box-shadow" src="{{page.imgdir}}/8.png"/>
<em>BitmapShader</em>

It’s clear that the use of BitmapShader provides the same high frame rate as using no masking at all. However, the performance of the SRC_IN method cannot be considered as good: fast scrolling causes noticeable interface lags, as is evidenced by the graph. Many frames  take longer than 16 ms to render, and some even more than 33 ms, that is, FPS drops below 30 ms.

# Conclusions
I would say that the advantages of using the BitmapShader approach are obvious: no need to allocate buffer memory, excellent flexibility, semi-transparency support, and high performance.
No wonder this approach is used in library implementations.

Share your thoughts in the comments section and may <a href="https://stackoverflow.com" target="_blank">stackoverflow.com</a> be with you!

**Arkady Gamza, Android developer**
