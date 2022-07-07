/*const end = window.innerWidth * 0.8 - 77.5;
let amount = 0;

const startJb = (isSupported) => {
	amount++;
	if(amount <= 1) {
		console.log("t");
		document.getElementById("interact").innerHTML = `<div class='jbBox'>${isSupported ? "Jailbreaking..." : "This Device is Unsupported"}</div>`;
		if(isSupported) {
			pwnMe();
		}
	}
};

$(function() {

	$("#slider").draggable({
		axis: 'x',
		containment: 'parent',
		drag: function(event, ui) {
			if (ui.position.left >= end) {
				$("#well").fadeOut();
				setTimeout(() => {startJb(false)}, 2000);
				return;
			} 
		},
		stop: function(event, ui) {
			if (ui.position.left < end) {
				$(this).animate({
					left: 0
				})
			}
		}
	});
	
	// The following credit: http://www.evanblack.com/blog/touch-slide-to-unlock/
	
	$('#slider')[0].addEventListener('touchmove', function(event) {
	    event.preventDefault();
	    var el = event.target;
	    var touch = event.touches[0];
	    curX = touch.pageX - this.offsetLeft - 73;
	    if(curX <= 0) return;
	    if(curX > end){
	    	$('#well').fadeOut();
			setTimeout(() => {startJb(true)}, 2000);
			return;
	    }
	   	el.style.webkitTransform = 'translateX(' + curX + 'px)'; 
	}, false);
	
	$('#slider')[0].addEventListener('touchend', function(event) {	
	    this.style.webkitTransition = '-webkit-transform 0.3s ease-in';
	    this.addEventListener( 'webkitTransitionEnd', function( event ) { this.style.webkitTransition = 'none'; }, false );
	    this.style.webkitTransform = 'translateX(0px)';
	}, false);

});*/

// slider logic from JailbreakMe (Star)
// with foxlet&stek additions (added MNT_NOSUID)

window.addEventListener('load', function()
{
    var wrapper =
    {
        onSlid: function()
        {
            let logo = document.getElementById('slider');
            logo.parentNode.removeChild(logo);
            document.body.className = 'wait';
            document.getElementById('interact').innerHTML = `<div class='jbBox'>${isSupported ? "Jailbreaking..." : "This Device is Unsupported"}</div>`;

            window.setTimeout(function(){
                window.go();
            }, 10);
        },
    };

    (function() {
        var thumbtack = document.getElementById('thumbtack');
        var hint = document.getElementById('hint');
        if(!thumbtack || !hint)
        {
            return;
        }

        var hintHideRatio = 1/4;
        var slidRatio = 0.9;

        var left = 0;
        var startX = null;
        var maxLeft = thumbtack.parentNode.clientWidth - thumbtack.clientWidth - 5;
        var startLeft = null;

        // Set spacing by left, since position is set to relative
        var set_left = function(newLeft) {
            left = newLeft;
            hint.style.opacity = 1 - (newLeft / (maxLeft * hintHideRatio));
            thumbtack.style.left = newLeft + 'px';
        };

        var onDown = function(x) {
            startX = x;
            startLeft = left;
            thumbtack.style.WebkitTransitionProperty = '';
            thumbtack.style.WebkitTransitionDuration = '0s';
            return false;
        };

        var onMove = function(x) {
            if (startX === null) return;

            var diff = x - startX;

            if (diff < 0) {
                diff = 0;
            } else if (diff >= maxLeft) {
                diff = maxLeft;
            }

            set_left(diff + startLeft);
        };

        var onEnd = function() {
            if (startX === null) return;
            startX = null;

            if (left/maxLeft >= slidRatio) {
                set_left(maxLeft);
                if(wrapper.onSlid)
                {
                    var onSlid = wrapper.onSlid;
                    wrapper.onSlid = undefined;
                    onSlid();
                }
                return false;
            }

            var oldLeft = left;
            set_left(0);
            thumbtack.style.WebkitTransform = 'translateX(' + oldLeft + 'px)';

            setTimeout(function() {
                thumbtack.style.WebkitTransitionProperty = '-webkit-transform';
                thumbtack.style.WebkitTransitionDuration = '0.25s';
                thumbtack.style.WebkitTransform = 'translateX(0px)';
            }, 0);

            return false;
        };

        thumbtack.ontouchstart = e => onDown(e.targetTouches[0].clientX);
        window.ontouchmove = e => onMove(e.targetTouches[0].clientX);
        window.ontouchend = e => onEnd();

        thumbtack.onmousedown = e => onDown(e.clientX);
        window.onmousemove = e => onMove(e.clientX);
        window.onmouseup = e => onEnd();

        return this;
    })();

    // Disable vertical scrolling in webapp
    window.ontouchstart = function(e) {
        e.preventDefault();
        return false;
    };
});