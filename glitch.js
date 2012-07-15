/**
	@license glitch.js v0.1 <http://www.github.com/sjhewitt/glitch.js>
	Released under MIT License

	Copyright (c) 2012 Simon Hewitt.
	http://www.twitter.com/sjhewitt
	*/
(function($){
	/*global html2canvas */

	var noop = function(){},
		/**
		 * Set default properties on an object
		 * @param  {Object} obj      The target object
		 * @param  {Object} defaults The default properties
		 * @return {Object}          The target obj
		 */
		defaults = function(obj, defaults) {
			for (var prop in defaults) {
				if (obj[prop] == null)
					obj[prop] = defaults[prop];
			}
			return obj;
		},
		/**
		 * Generates an integer between min and max
		 *
		 * @param  {Number} min The lower bound
		 * @param  {Number} max The upper bound
		 * @return {Number}     A random number
		 */
		getRandInt = function(min, max) {
			return (Math.floor(Math.random() * (max - min) + min));
		};


	/**
	 * Apply the glitch effect to a canvas object
	 *
	 * @param  {HTMLCanvasElement} canvas  The canvas (or HTMLImageElement) to apply the glitch to
	 * @param  {number}            amount  The amount to glitch the canvas (default: 6)
	 * @return {HTMLCanvasElement}         A canvas containing a glitched version
	 *                                     of the original canvas
	 */
	var _glitch = function(canvas, amount) {
		var
			// cache the width and height of the canvas locally
			x, y, w = canvas.width, h = canvas.height,

			// _len is an iterator limit, initially storing the number of slices
			// to create
			i, _len = amount || 6,

			// pick a random amount to offset the color channel
			channelOffset = (getRandInt(-_len*2, _len*2) * w * + getRandInt(-_len, _len)) * 4,

			// the maximum amount to offset a chunk of the image is a function of its width
			maxOffset = _len * _len / 100 * w,

			// vars for the width and height of the chunk that gets offset
			chunkWidth, chunkHeight,

			// create a temporary canvas to hold the image we're working on
			tempCanvas = document.createElement("canvas"),
			tempCtx = tempCanvas.getContext("2d"),

			srcData, targetImageData, data;

		// set the dimensions of the working canvas
		tempCanvas.width = w;
		tempCanvas.height = h;

		// draw the initial image onto the working canvas
		tempCtx.drawImage(canvas, 0, 0, w, h);

		// store the data of the original image for use when offsetting a channel
		srcData = tempCtx.getImageData(0, 0, w, h).data;

		// randomly offset slices horizontally
		for (i = 0; i < _len; i++) {

			// pick a random y coordinate to slice at
			y = getRandInt(0, h);

			// pick a random height of the slice
			chunkHeight = Math.min(getRandInt(1, h / 4), h - y);

			// pick a random horizontal distance to offset the slice
			x = getRandInt(1, maxOffset);
			chunkWidth = w - x;

			// draw the first chunk
			tempCtx.drawImage(canvas,
				0, y, chunkWidth, chunkHeight,
				x, y, chunkWidth, chunkHeight);

			// draw the rest
			tempCtx.drawImage(canvas,
				chunkWidth, y, x, chunkHeight,
				0, y, x, chunkHeight);
		}

		// get hold of the ImageData for the working image
		targetImageData = tempCtx.getImageData(0, 0, w, h);

		// and get a local reference to the rgba data array
		data = targetImageData.data;

		// Copy a random color channel from the original image into
		// the working canvas, offsetting it by a random amount
		//
		// ImageData arrays are a single dimension array that contains
		// 4 values for each pixel.
		// so, by initializing `i` to a random number between 0 and 2,
		// and incrementing by 4 on each iteration, we can replace only
		// a single channel in the image
		for(i = getRandInt(0, 3), _len = srcData.length; i < _len; i += 4) {
			data[i+channelOffset] = srcData[i];
		}

		// Make the image brighter by doubling the rgb values
		for(i = 0; i < _len; i++) {
			data[i++] *= 2;
			data[i++] *= 2;
			data[i++] *= 2;
		}

		// TODO: The above loops are the most costly in this function, iterating
		// over all the pixels in the image twice.
		// It maybe possible to optimize this by combining both loops into one,
		// and only processing every other line, as alternate lines are replaced
		// with black in the 'scan lines' block belop

		// copy the tweaked ImageData back into the context
		tempCtx.putImageData(targetImageData, 0, 0);

		// add scan lines
		tempCtx.fillStyle = "rgb(0,0,0)";
		for (i = 0; i < h; i += 2) {
			tempCtx.fillRect (0, i, w, 1);
		}

		return tempCanvas;
	};

	/**
	 * Creates a canvas containing a glitched version of the element
	 * @param  {DOMElement} el     The element to glitch
	 * @param  {Object}   options  An object containing the complete callback,
	 *                             the amount to glitch the image, and any
	 *                             html2canvas options
	 */
	var glitch = function(el, options) {
		options = defaults(options || {}, {
			// the amount to glitch the image
			amount: 6,
			// a callback that takes the glitched canvas as its only argument
			complete: noop
		});

		// callback for when the element has been rendered
		options.onrendered = function(canvas) {
			options.complete(_glitch(canvas, options.amount));
		};

		// render the element onto a canvas
		html2canvas(el[0] ? el : [el], options);
	};

	/**
	 * Replace el with a glitched version of it
	 * @param  {DOMElement} el  The element to glitch
	 * @param  {Object} options An object containing the options for glitch
	 */
	glitch.replace = function(el, options) {
		options = options || {};
		// store a reference to the complete callback so we can use the same
		// options for the glitch function call
		var _complete = options.complete;
		options.complete = function(canvas) {
			if($ && el instanceof $) {
				el.after(canvas).detach();
			} else {
				// no jQuery...
				el.parentNode.insertBefore(canvas, el);
				el.parentNode.removeChild(el);
			}
			if(_complete){
				_complete();
			}
		};

		glitch(el, options);
	};

	/**
	 * Replace `el` with `newEl` by overlaying a glitched version of `el`, then
	 * animating it out to reveal `newEl`
	 *
	 * The animation will take into account elements of different sizes by sliding
	 * the container to reveal it, however it looks best if the elements to be
	 * transitioned between are of similar sizes
	 *
	 * @param  {jQuery} el     The original element that will be glitched
	 * @param  {jQuery} newEl  The element to show
	 * @param  {Object} options An object containing the options for the animation
	 *                          and any options for html2canvas
	 */
	glitch.transition = function(el, newEl, options) {
		// set the default options
		options = defaults(options || {}, {
			// the amount to glitch the image
			amount: 6,
			// A callback when the animation is complete
			complete: noop,
			// The delay after rendering the glitched element until starting the transition
			delay: 300,
			// The duration of the transition effect
			duration: 500,
			// The z-index to apply to the overlay. You might need to tweak this if
			// you have things that appear above the element, or are using high
			// z-indexes in your page
			zIndex: 1000,
			// the transition effect to use. This may be "fade" or "slide"
			effect: "fade",
			// The size of the top border. Set to 0 to disable, only used in slide mode
			borderSize: 2,
			// The color of the top border, only used in slide mode
			borderColor: "green"
		});

		// add the new element to the dom so we can properly calculate its dimensions
		newEl.insertAfter(el);

		// store a reference to the complete callback so we can use the same
		// options for the glitch function call
		var _complete = options.complete,
			// get the dimensions of the elements so we can resize the targetContainer
			// to reveal all the content after the glitch transition
			origHeight = el.outerHeight(true),
			origWidth = el.outerWidth(true),
			targetHeight = newEl.outerHeight(true),
			targetWidth = newEl.outerWidth(true),
			origOverflow = newEl.css("overflow");

		// take the new element out of the dom again
		newEl.detach();

		// create a callback that will
		options.complete = function(canvas){
			// position the canvas absolutely within the container
			var $canvas = $(canvas).css("position", "absolute"),
				offset = el.offset(),
				// create a container element that contains the canvas and position it
				// over the element we're replacing
				container = $("<div>").css({
						"border-top": options.borderSize ? options.borderSize + "px solid " +
							options.borderColor : "none",
						position: "absolute",
						left: offset.left,
						top: offset.top - options.borderSize,
						width: canvas.width,
						height: canvas.height,
						overflow: "hidden",
						"z-index": options.zIndex
					})
					// add the canvas as a child to the container
					.html(canvas)
					// add the container to the dom
					.appendTo("body")
					// delay the animation a bit
					.delay(options.delay),

				targetContainer = $("<div>").css({
					width: origWidth,
					height: origHeight,
					overflow: "hidden",
					border: "none",
					"box-sizing": "border-box"
				})
					.html(newEl),

				// the default transition effect is to fade out
				animation = {
					opacity: 0
				},
				animateOptions = {
						duration: options.duration,
						complete: function(){
							// when the animation is done:
							// remove the container from the dom
							container.remove();

							// then animate the height of the new element back to its measured
							// height and width
							targetContainer.animate({
								height: targetHeight,
								width: targetWidth
							},
							{
								duration: 100,
								complete: function(){

									// take the targetContainer element out of the dom
									newEl.detach().insertAfter(targetContainer);
									targetContainer.remove();

									// call the complete callback
									_complete();

									// and clear all references
									options = $canvas = container = null;

								}
							});

						}
					};

			if(options.effect === "slide") {
				// for the slide effect, we move move the container down
				animation = {
					top: offset.top + canvas.height,
					height: 0
				};

				// and on each step of the animation, we need to offset the top so it
				// remains in the same place on the screen
				animateOptions.step = function(now, fx){
					if(fx.prop === "top") {
						$canvas.css("top", fx.start - now);
					}
				};
			}

			// apply the animation
			container.animate(animation, animateOptions);

			// replace the original element with the new one
			// we use detatch so that the event handlers on the old
			// element are retained.
			targetContainer.insertAfter(el);
			el.detach();

		};

		// create a glitched version of the start element
		glitch(el, options);
	};

	window.glitch = glitch;

	if($) {
		/**
		 * jQuery glitch.js plugin
		 *
		 * This can be called in the following ways:
		 *
		 * Replace the element with a glitched version
		 *     $("#el").glitch()
		 *
		 * Create a glitched canvas and pass it to a callback function
		 *     $("#el").glitch(function(canvas){})
		 *
		 * Transition effect
		 *     $("#el").glitch('transition', $("#newEl"), {})
		 */
		$.fn.glitch = function(method) {
			var args = Array.prototype.splice.call(arguments, 1);
			method = method || 'replace';
			return this.each(function(){
				if(method instanceof $) {
					glitch.transition($(this), method, args[0]);
				} else if(typeof method == 'function') {
					// just a callback passed in
					glitch($(this), {
						complete: method
					});
				} else if(typeof method == 'object') {
					// an options object passed in
					glitch($(this), method);
				} else if(glitch.hasOwnProperty(method)) {
					// explicitly call a method
					glitch[method].apply(null, [$(this)].concat(args));
				} else {
					$.error('Method ' +  method + ' does not exist on jQuery.glitch');
				}
			});
		};
	}
})(window.jQuery);
