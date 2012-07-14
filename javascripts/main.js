/*global $,glitch,glitchReplace */
$(function(){
	var headerContainer = $("#glitch-header").wrap("<div>").parent();
	var glitchHeader = function(){
		glitch.transition(headerContainer.children(), $("#glitch-header").clone(), {
			effect:"slide",
			delay: 1000,
			complete: function() {
				setTimeout(glitchHeader, 1000);
			}
		});
	};
	glitchHeader();
});