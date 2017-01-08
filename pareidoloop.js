var Pareidoloop = new function() {

    var seeding;
    var ticking;
    var genCount;
    var lastImprovedGen;
    var faceA, faceB;
    var canvasA, canvasB, canvasOut, scoreA, scoreB;
    var outputCallback;
    var imagemagick;

    var settings = {
       CANVAS_SIZE : 50,
       OUTPUT_SIZE : 100,
       INITIAL_POLYS : 60,
       MAX_POLYS : 1000,
       MAX_GENERATIONS : 6000,
       MAX_GENS_WITHOUT_IMPROVEMENT : 1000,
       CONFIDENCE_THRESHOLD : 30,
       QUAD_ADD_STDDEV : 0.5,
       QUAD_INIT_STDDEV : 0.2,
       BG_COLOR : "#1E1E1E"
    };

    this.stop = function() {
            ticking = false;
    }

    this.start = function(args) {

        if (args) {
            if (args.outputSize) {
                settings.OUTPUT_SIZE = args.outputSize;
            }
            if (args.outputCallback) {
                outputCallback = args.outputCallback;
            }
            if (args.confidenceThreshold) {
                settings.CONFIDENCE_THRESHOLD = args.confidenceThreshold;
            }
            if (args.maxGenerations) {
                settings.MAX_GENERATIONS = args.maxGenerations;
            }
        }

        canvasA = document.getElementById("canvasA");
        scoreA = document.getElementById("scoreA");
        canvasB = document.getElementById("canvasB");
        scoreB = document.getElementById("scoreB");

        canvasOut = document.createElement("canvas");

        reset();
        ticking = true;
        tick();
    }

    var reset = function() {

        initCanvas(canvasA, settings.CANVAS_SIZE);
        clearCanvas(canvasA);
        initCanvas(canvasB, settings.CANVAS_SIZE);
        clearCanvas(canvasB);
        initCanvas(canvasOut, settings.OUTPUT_SIZE);
        clearCanvas(canvasOut);

        scoreA.innerHTML = "Waiting for initial detection ... patience";
        scoreB.innerHTML = "";

        faceA = new Face([]);
        faceB = null;
        genCount = 0;
        lastImprovedGen = 0;
        seeding = true;
    }

    var rnd = function(mean, stdev) {

        // pinched from http://www.protonfish.com/random.shtml
        return ((Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1))*stdev+mean;
    };

    var initCanvas = function(canvas, size) {

        canvas.width = canvas.height = size;

        // set origin at center
        canvas.getContext("2d").setTransform(1, 0, 0, 1, size/2, size/2);
    }

    var clearCanvas = function(canvas) {

        var ctx = canvas.getContext("2d");
        ctx.fillStyle = settings.BG_COLOR;
        ctx.globalAlpha = 1;
        ctx.fillRect(-canvas.width/2,-canvas.height/2,canvas.width,canvas.height);
    };

    var getSeedFace = function() {

            // create a bunch of randomish quads to kick things off
            var quads = [];
            for (var i=0; i<settings.INITIAL_POLYS; i++) {

                quads[i] = new Quad(
                        [rnd(0,settings.CANVAS_SIZE/10),rnd(-settings.CANVAS_SIZE/8,settings.CANVAS_SIZE/6)],
                        rnd(settings.CANVAS_SIZE/3,settings.CANVAS_SIZE/7.5),
                        rnd(0.02,0.2),
                        settings.QUAD_INIT_STDDEV
                );
            }

            return new Face(quads);
    };

    var shouldMove = function(newScore, oldScore) {
        // if the new state is better, move to it no matter what.
        if(newScore > oldScore)
            return true;

        // never accept a score that is not a face.
        if(newScore <= -999)
            return false;

        // otherwise, use a simulated annealing "temperature" to determine
        // whether or not to move.

        // if it's the same, 50/50
        if(newScore == oldScore)
            return Math.random() < .5;

        // the temperature ranges from 0.01 to 1.  The closer we are to
        // the target, the lower the temperature.
        var temperature = Math.max(0.01, 1 - (oldScore / settings.CONFIDENCE_THRESHOLD));

        // The probability we'll move is determined by the difference between
        // the old and new scores, and the current temperature.
        var probability = Math.exp((newScore - oldScore) / temperature * 5);

        return Math.random() < probability;
    };

    var tStart = +(new Date());
    var tBegin = tStart;
    var tEnd;
    var tDiff = -1;

    var tick = function() {

        if (!ticking) {
            return;
        }

        if (seeding) {
            // spam random polys until ccv gets a false positive
            faceB = getSeedFace();
        } else {
            // evolve previous generation
            faceB = faceA.produceChild();
            genCount++;
        }

        // render new generation
        clearCanvas(canvasB);
        faceB.draw(canvasB.getContext("2d"));

        // test fitness of new generation
        var fitness = faceB.measureFitness(canvasB);

        var fitnessScore = -999;
        if (genCount % 100 === 0) {
          tEnd = +(new Date())
          tDiff = (tEnd - tStart) / 1000;
          tStart = tEnd;
          tLeft = ((settings.MAX_GENERATIONS - genCount) / 100) * tDiff;
          tElapsed = (tEnd - tBegin) / 1000;
        }
        var message = "Gen: "+genCount+"(" + tDiff + ", running for: " + Math.round(tElapsed) + "s, left: " + Math.round(tLeft) + "s), ";

        if (fitness.numFaces > 1) {
            // only want to make one face
            message = message + "multiple faces";
        } else if (fitness.numFaces == 0) {
            message = message + "no faces detected";
        } else if (fitness.bounds.width < settings.CANVAS_SIZE/2 || fitness.bounds.height < settings.CANVAS_SIZE/2) {
            // don't want tiny features detected as faces
            message = message + "face too small";
        } else {
            fitnessScore = fitness.confidence;
            message = message + "fitness: " + String(fitnessScore).substr(0,10);
        }
        scoreB.innerHTML = message;

        if (shouldMove(fitnessScore, faceA.fitness)) {

            // new generation replaces previous fittest

            seeding = false;

            clearCanvas(canvasA);
            faceB.draw(canvasA.getContext("2d"));
            faceB.drawBounds(canvasA.getContext("2d"));
            scoreA.innerHTML = message;

            lastImprovedGen = genCount;
            faceA = faceB;
        }

        if (genCount > settings.MAX_GENERATIONS ||
                (genCount - lastImprovedGen) > settings.MAX_GENS_WITHOUT_IMPROVEMENT ||
                fitnessScore > settings.CONFIDENCE_THRESHOLD) {

            // render finished face out as an image

            var outCtx = canvasOut.getContext("2d");
            var outScale = settings.OUTPUT_SIZE/settings.CANVAS_SIZE;
            outCtx.scale(outScale, outScale);
            faceA.draw(outCtx);
            var dataUrl = canvasOut.toDataURL();

            var outputImg = document.createElement("img");
            outputImg.src = dataUrl;

	    if (outputCallback) {
		    outputCallback(outputImg);
	    }

            // go again
            reset();
        }

        setTimeout(tick,1);
    }


    var Quad = function(origin, scale, alpha, stdDev) {

        // Create quad with corners on unit square, perturbed by stdDev
        this.points = [
            [rnd(-0.5,stdDev),rnd(-0.5,stdDev)],
            [rnd(0.5,stdDev),rnd(-0.5,stdDev)],
            [rnd(0.5,stdDev),rnd(0.5,stdDev)],
            [rnd(-0.5,stdDev),rnd(0.5,stdDev)]
        ];

        // Make a random color
        var clip = function(x, min, max) {
            return Math.min(max, Math.max(min, x));
        };

        this.draw = function(ctx) {

                   ctx.save();
                   ctx.translate(origin[0],origin[1]);
                   ctx.scale(scale,scale);
                   ctx.beginPath();

                   for (var i=0; i<4; i++) {
                       ctx.lineTo(this.points[i][0],this.points[i][1]);
                   }

                   ctx.closePath();

                   if (alpha > 0) {
		       ctx.fillStyle = "#ffffff";
                       ctx.globalAlpha = alpha;
                   } else {
		       ctx.fillStyle = "#000000";
                       ctx.globalAlpha = -alpha;
                   }

                   ctx.fill();
                   ctx.restore();
        }
    };

    var Face = function(quads) {

               this.quads = quads;

               this.fitness = -999;

               this.bounds = {
                   x: 0,
                   y: 0,
                   width: settings.CANVAS_SIZE,
                   height: settings.CANVAS_SIZE
               };

               this.produceChild = function() {

                   var childQuads = [];

                   for (var i=0; i<this.quads.length; i++) {
                       childQuads[i] = this.quads[i];
                   }

                   // Increase prob of removing a poly as we approach max
                   if (Math.random() * settings.MAX_POLYS < childQuads.length) {

                       var victimIdx = Math.floor(Math.random()*childQuads.length);
                       childQuads.splice(victimIdx,1);
                   } else {

                       // centre new poly generation on the bounds of the detected face
                       var newOrigin = [
                                rnd(this.bounds.x + this.bounds.width/2, this.bounds.width/4),
                                rnd(this.bounds.y + this.bounds.height/2, this.bounds.height/4)
                            ];

                       var newScale =  35 > this.fitness ? Math.sqrt(Math.abs(35-this.fitness)) : 1;

                       // scale by detected area.
                       newScale *= this.bounds.width / 25;

                       var newAlpha = rnd(0, 0.45);
                       newAlpha = newAlpha > 1.0 ? 1.0 : newAlpha < -1.0 ? -1.0 : newAlpha;
                       childQuads[childQuads.length] = new Quad(
                               newOrigin, newScale, newAlpha, settings.QUAD_ADD_STDDEV
                               );
                   }

                   return new Face(childQuads);
               }

               this.draw = function(ctx) {
                   var numQuads = this.quads.length;
                   for (var i=0; i<numQuads; i++) {
                       this.quads[i].draw(ctx);
                   }
               }

               this.drawBounds = function(ctx) {
                   ctx.globalAlpha = 1;
                   ctx.strokeStyle = "#00ff00";
                   ctx.strokeRect(this.bounds.x,this.bounds.y,this.bounds.width,this.bounds.height);

                   var adapted_x = Math.round((this.bounds.x+settings.CANVAS_SIZE/2)/settings.CANVAS_SIZE*settings.OUTPUT_SIZE);
				   var adapted_y = Math.round((this.bounds.y+settings.CANVAS_SIZE/2)/settings.CANVAS_SIZE*settings.OUTPUT_SIZE);

				   var adapted_height = Math.round((this.bounds.height)/settings.CANVAS_SIZE*settings.OUTPUT_SIZE);
				   var adapted_width = Math.round((this.bounds.width)/settings.CANVAS_SIZE*settings.OUTPUT_SIZE);

				   var new_imagemagick = adapted_width+"x"+adapted_height+"+"+adapted_x+"+"+adapted_y;
				   if(imagemagick != new_imagemagick) {
				      imagemagick = new_imagemagick;
				      imagemagickhtml.innerHTML = imagemagick;
				   }
               }

               this.measureFitness = function(canvas) {

                   // ask ccv to do the hard part
                   var comp = ccv.detect_objects({ "canvas" : canvas,
                       "cascade" : cascade,
                       "interval" : 5,
                       "min_neighbors" : 1 });

                   if (comp.length == 1) {
                       comp[0].x -= canvas.width/2;
                       comp[0].y -= canvas.height/2;

                       this.bounds.x = comp[0].x;
                       this.bounds.y = comp[0].y;
                       this.bounds.width = comp[0].width;
                       this.bounds.height = comp[0].height;

                       this.fitness = comp[0].confidence;
                   }

                   return {numFaces : comp.length, bounds : this.bounds, confidence : this.fitness};
               }
    }
}
