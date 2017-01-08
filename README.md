About this fork
===============
This fork displays imagemagick crop argument to easily crop the rendered image to the face detected only.

It also displays these value during rendering.

Useful if you want to crop the rendered image to get only the "face" part as detected by ccv.

Example 
=======
* Output size : 1000
* File name is 617x617+158+57.png
* `convert -crop 617x617+158+57 617x617+158+57.png face.png`
* face.png contains face as seen highlighted under "fittest generation", at full resolution

What you can do with this fork
==============================

1. Generate a bunch of pictures. (Here I did 50 faces of 2000x2000px, fitness=30, max generation=10000.)
2. Crop the faces using imagemagick:

    ```
    convert -crop 1019x1019+240+47 images/1019x1019+240+47.png cropped/1019x1019+240+47.png 
    convert -crop 1019x1019+267+157 images/1019x1019+267+157.png cropped/1019x1019+267+157.png
    convert -crop 1019x1019+47+240 images/1019x1019+47+240.png cropped/1019x1019+47+240.png
    …
    ```

3. Resize them all to the same size:
    
    ```
    convert -resize 1000x cropped/1019x1019+240+47.png resized/1019x1019+240+47.png 
    convert -resize 1000x cropped/1019x1019+267+157.png resized/1019x1019+267+157.png
    convert -resize 1000x cropped/1019x1019+47+240.png resized/1019x1019+47+240.png
    ```

4. Average them:

    `convert resized/*.png -evaluate-sequence mean averaged.png`
    
    ![](https://i.imgur.com/jSNS3qQ.png)

pareidoloop
===========

1. generate random polygons
2. feed them into a face detector
3. mutate to increase recognition confidence

difficult stuff (the cv lib) by [liuliu]

idea via roger alsing's [evolution of mona lisa], and greg borenstein's [machine pareidolia]

[liuliu]: https://github.com/liuliu/ccv
[evolution of mona lisa]: http://rogeralsing.com/2008/12/07/genetic-programming-evolution-of-mona-lisa/
[machine pareidolia]: http://urbanhonking.com/ideasfordozens/2012/01/14/machine-pareidolia-hello-little-fella-meets-facetracker/

notes
=====
* try out a [demo]
* currently tested only in chrome (v 21)
* hangs firefox in some cases, on some OSes
* "autosave images" only works in chrome (uses a@download attribute)
* large output sizes result in corrupt images (data:// URLs too long?)
* probably a bunch of other bugs in there
* have patience - let it churn away for a few hours and see what you get
* annealing simulation from [russellmcc]

[demo]: http://iobound.com/pareidoloop/
[russellmcc]: https://github.com/russellmcc/pareidoloop
