const loginBox = document.querySelector("#login-box");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const loginButton = document.querySelector("#login-button");

const USERNAME = "npacivitas";
const PASSWORD = "neoprodigyacademy";

const ADMIN_USERNAME = "itsraxeira";
const ADMIN_PASSWORD = "github";

password.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        login();
    }
});

function showLoginModal() {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    loginBox.classList.remove("hidden");
    loginBox.classList.add("visible");

    loginButton.addEventListener("click", login);
}

function login() {
    if (username.value && password.value) {
        firebaseLogin(username.value, password.value);
    } else {
        alert("Username or password wrong,\nPlease try again.");
    }
}

function showDashboard(isAdmin) {
    closeOverlay();
    loadSingleDatabase();
    if (isAdmin) loadButton.style.display = "inline-block";
}

function closeOverlay() {
    overlayBoxes.forEach((box) => {
        overlay.classList.remove("flex");
        overlay.classList.add("hidden");
        box.classList.remove("visible");
        box.classList.add("hidden");
    })
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function showWarning() {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    warningBox.classList.remove("hidden");
    warningBox.classList.add("visible");
}

closeWarningButton.addEventListener("click", (event) => {
    closeOverlay(event);
    showLoginModal()
});

window.onload = () => {
    // showWarning();
    // loadSingleDatabase();
}


firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        if (user.email == "itsraxeira@gmail.com") {
            showDashboard(true);
        } else {
            showDashboard(false);
        }
    } else {
        showWarning()
    }
});