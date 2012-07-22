About this fork
===============
This fork displays imagemagick crop argument to easily crop the rendered image to the face detected only.

It also displays these value during rendering.

Useful if you want to crop the rendered image to get only the "face" part as detected by ccv.

Example 
=======
* Output size : 1000
* File name is 617x617+158+57.png
* imagemagick -crop 617x617+158+57 617x617+158+57.png face.png
* face.png contains face as seen highlighted under "fittest generation", at full resolution

What you can do with this fork
==============================
I first generated the 30 faces you can see below : (already "face-cropped" here)

![sample cropped faces](http://cloud.github.com/downloads/vhf/pareidoloop/mosaic.png "out")

Then I overlayed them to generate a less cubist face :

![overlayed faces](http://cloud.github.com/downloads/vhf/pareidoloop/out.png "out")

1. generate images
2. crop them to get only the "facial" part of generated images (imagemagick)
3. resize all of them to size of the smallest one (imagemagick)
4. overlay them (imagemagick)

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