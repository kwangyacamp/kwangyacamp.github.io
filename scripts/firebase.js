var firebaseConfig = {
    apiKey: "AIzaSyAgBH2v1vbk01wotsu3JMPqkp5-KpEX4-4",
    authDomain: "kwangya-camp.firebaseapp.com",
    projectId: "kwangya-camp",
    storageBucket: "kwangya-camp.appspot.com",
    messagingSenderId: "76257932710",
    appId: "1:76257932710:web:10107e661d2397fb9ecb67"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

function firebaseLogin(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // ...
            alert(errorCode + ': ' + errorMessage);
        });
}

function firebaseRegister(email, password) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // ...
        });
}

var currentUser;

var ui = new firebaseui.auth.AuthUI(firebase.auth());

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        var uid = user.uid;
        console.log(`UID: ${uid}`);
        currentUser = user;
    } else {
        currentUser = null;
    }
});

function firebaseLogin(container = '#login-box', callback) {
    ui.start(container, {
        callbacks: {
            signInSuccessWithAuthResult: (authResult, redirectUrl) => {
                if (authResult != null) currentUser = authResult.user;
                console.log(`sign-in flow => UID: ${currentUser.uid}`);
                callback(authResult);
                return false;
            },
        },
        signInOptions: [
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            firebase.auth.TwitterAuthProvider.PROVIDER_ID
        ],
        // Other config options...
    });
}