var headerTapCounter = 0;

currentFirmware = function (userAgent) {
	return userAgent.match(/\OS (.*?)\ like/)[1].replaceAll("_", ".");
};

function slideEasterEgg() {
	headerTapCounter++;
	if (headerTapCounter == 5) {
		document.getElementById("jbButton").style.display = "none";
		document.getElementById("page-wrap").style.display = "block";
	}
}

async function pwnMe() {
	if (location.protocol = "https:") {
		document.getElementById("jbButton").disabled = true;
		if (currentFirmware(navigator.userAgent).startsWith("14.5")) {
			alert("Hey!\nAs of now, the jailbreak is not ready.");
			socket.send("log_normal", "Starting exploitation for iOS 14.5");
			await kickstart145();
		} else if (currentFirmware(navigator.userAgent).startsWith("14.6")) {
			alert("Hey!\nAs of now, the jailbreak is not ready.");
			socket.send("log_normal", "Starting exploitation for iOS 14.6");
			await kickstart146();
		} else if (navigator.userAgent.includes("Windows NT 10.0")) {
			socket.send("log_normal", "Dude is on windows. dummy");
			alert("This is an iOS jailbreak, use this on your iPhone. Not your PC.");
		} else {
			socket.send("error", "Detected a unsupported version/device");
		}
	}else{
		socket.send("error", "ur mom gey");
	}
}

const appHeight = () => {
	const doc = document.documentElement;
	doc.style.setProperty("--app-height", `${window.innerHeight}px`);
};

window.addEventListener("resize", appHeight);
appHeight();