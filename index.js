var headerTapCounter = 0;

currentFirmware = function (userAgent) {
	return userAgent.match(/\OS (.*?)\ like/)[1].replaceAll("_", ".");
};

function slideEasterEgg() {
	headerTapCounter++;
	if (headerTapCounter == 5) {
		document.getElementById("jbButton").style.display = "none";
		document.getElementById("page-wrap").style.display = "block";
    iosAlert("As of now, the slider doesn't work. 😢\n\nI will fix this soon.\n\nRefresh the page to get the button back.");
	}
}

async function pwnMe() {
  if (location.protocol === "https:") {
    document.getElementById("jbButton").disabled = true;
    var devices = (/iPhone|iPad|iPod/i);
    if(devices.test(navigator.userAgent))	{
			if (currentFirmware(navigator.userAgent).startsWith("14.5")) {
        document.getElementById("jbButton").innerHTML = "Jailbreaking 🔓📱...";
        iosAlert("AudioWorklet exploit for iOS 14.5 has been executed!");
  		} else if (currentFirmware(navigator.userAgent).startsWith("14.6")) {
        document.getElementById("jbButton").innerHTML = "Jailbreaking 🔓📱...";
        iosAlert("AudioWorklet exploit for iOS 14.6 has been executed!");
			} else {
        iosAlert("Uh-oh!\n\niOS " + currentFirmware(navigator.userAgent) + " is not supported.\n\nPlease use an iOS 14.5 or 14.6 device.");
			}
		} else {
      //iosAlert('Uh-oh!\n\nYou are on a desktop environment, which is not supported.\n\nUse this on a compatible iOS device.', 'Etcetera');
			document.getElementById("jbButton").innerHTML = "Jailbreaking 🔓📱...";
			//[1]
		}
  }
}


function iosAlert() {
try {
  var $alert = document.querySelector('.alert');
  $alert.parentElement.removeChild($alert);
} catch ($error) {}

var $alert = document.createElement('span');
if (arguments[1] == null) {
  arguments[1] = window.location.protocol + '//' + window.location.hostname;
}
$alert.innerHTML = '<div class="alert"><div class="inner"><div class="title">' + arguments[1] + '</div><div class="text">' + arguments[0] + '</div></div><div class="button">OK</div></div>';
document.querySelector('body').appendChild($alert);
setTimeout(function() {
  document.querySelector('.alert .button:last-child').addEventListener("click", function() {

    $alert.parentElement.removeChild($alert);
  });
});
return false;

}

const appHeight = () => {
	const doc = document.documentElement;
	doc.style.setProperty("--app-height", `${window.innerHeight}px`);
};

window.addEventListener("resize", appHeight);
appHeight();
