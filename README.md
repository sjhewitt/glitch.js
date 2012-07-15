glitch.js
=========

A glitched effect for DOM elements.

![Glitched image](http://sjhewitt.github.com/glitch.js/images/example.png)

See the [examples page](http://sjhewitt.github.com/glitch.js/examples.html) for 
an idea of what it does.

Usage
-----

glitch.js depends on [html2canvas](https://github.com/niklasvh/html2canvas) so 
make sure you've loaded it before applying the effect.

If you want to use the transition animation then a recent version of jQuery is
also needed.

There are 3 functions available to acheive the effect, exposed via the `glitch`
property of the window namespace, and as a jQuery plugin if jQuery is available: 

### Glitch

To generate a canvas that contains a glitched version of the element, just
call the `glitch` function:

```javascript
glitch(document.getElementById("currentContent"), {
    amount: 8,
    complete: function(canvas){
        // do something with the glitched canvas
    }
});
```

And using the jQuery plugin:

```javascript
// callback only:
$("#currentContent").glitch(function(canvas){
    // do something with canvas
});

// or with options
$("#currentContent").glitch({
    amount: 8,
    complete: function(canvas){
        // do something with canvas
    }
})
```

The options are:

<table>
    <tr>
        <th>amount</th>
        <td>The amount to glitch the image (default: 6)</td>
    </tr>
    <tr>
        <th>complete</th>
        <td>A callback that takes the glitched canvas as its only argument</td>
    </tr>
</table>

### Glitch Replace

To replace the element with a glitched version, call `glitch.replace` using the
same options as glitch.

```javascript
glitch.replace(document.getElementById("currentContent"), {
    amount: 6
});
```

Using the jQuery plugin:

```javascript
$("#currentContent").glitch();

// to pass options in:
$("#currentContent").glitch('replace', {
    amount: 7
});
```

### Glitch Transition

To transition between two elements by glitching the first element and then 
revealing the second element, pass a jQuery object as the first argument of the
`glitch` function call.

```javascript
$("#currentContent").glitch($("<div><p>New Content</p></div>"), {
    amount: 7,
    effect: "slide",
    complete: function(){
        // do something when the animation is complete
    }
});
```

Notes
-----

There are currently no checks for canvas support, so this will break in older 
browsers (IE8 and below.) Unfortunately excanvas won't help, as access is needed
to the `getBitmapData` function to actually create the effect.

As html2canvas has to iterate over the contents of the element when rendering it
to the canvas, it goes to stand that the more complex the dom, the longer the 
rendering will take. This is especially true of any images that are attached 
(including background images,) as they have to be re-loaded asynchronously by 
the browser. If there are any images from another domain, then they have to be 
loaded via a proxy to avoid tainting the canvas. So, it's wise to remove any 
unneeded elements from the dom before applying the effect.

html2canvas scrolls the window to the top when rendering the page (see 
[Issue 57](https://github.com/niklasvh/html2canvas/issues/57)) which is fine for
my usage, but may not be ideal for you. There are 2 answers for this: store the 
scroll position before calling glitch, and set it back in the complete handler, 
or contribute a fix to the html2canvas project (I'm working on a fix on 
[my fork](https://github.com/sjhewitt/html2canvas/tree/no-scroll)!)
