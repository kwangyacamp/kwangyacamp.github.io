const faceclaim = document.querySelector("#faceclaim");
const clanname = document.querySelector("#clanname");
const yourname = document.querySelector("#yourname");
const prodigium = document.querySelector("#prodigium");
const status = document.querySelector("#status");
const registerbutton = document.querySelector("#register-button");
const searchBar = document.querySelector("#search-bar");

const overlay = document.querySelector(".overlay");
const overlayBoxes = document.querySelectorAll(".overlay-box");

const editBox = document.querySelector("#edit-box");
const editFace = document.querySelector("#edit-faceclaim");
const editClan = document.querySelector("#edit-clanname");
const editName = document.querySelector("#edit-name");
const editProdigy = document.querySelector("#edit-prodigy");
const editStatus = document.querySelector("#edit-status");
const editButton = document.querySelector("#edit-button");

const loadButton = document.querySelector("#load-button");

const warningBox = document.querySelector('#warning-box');
const closeWarningButton = document.querySelector('#close-warning-button');

class User {
    constructor(user) {
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.cabin = user.cabin;
        this.faceClaim = user.faceClaim;
        this.weapons = user.weapons;
        this.abilities = user.abilities
        if (!user.id) {
            this.id = this.getID();
        } else {
            this.id = user.id;
        }
    }

    toObject() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            cabin: this.cabin,
            faceClaim: this.faceClaim,
            weapons: this.weapons,
            abilities: this.abilities
        }
    }

    getID() {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c =='x' ? r : (r & 0x3| 0x8)).toString(16);
        });
        return uuid;
    }
}

class UserList {
    constructor(users = {}) {
        this.users = users;
    }

    add(user) {
        this.users[user.id] = user;
    }

    toObject() {
        return JSON.parse(JSON.stringify(this.users));
    }
}

const listConverter = {
    toFirestore(userList) {
        return { users: userList.toObject() };
    },
    fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        outSnap = data;
        let map = {};
        objKeys = Object.keys(data.users);
        objKeys.forEach((id) => {
            map[id] = new User(data.users[id]);
        });
        return new UserList(map);
    }
}

const COLLECTION_ID = "trainees";
const DOC_ID = "users"
const DB_ID = "members"

let ghost = new User({ firstName: "Jin", lastName: "Sakai", cabin: "Ghost", faceClaim: "imgur.com", weapons: [], abilities: [] });
let shimura = new User({ firstName: "Lord", lastName: "Shimura", cabin: "Samurai", faceClaim: "imgur.com", weapons: [], abilities: [] });

function registerUser(newUser) {
    let docRef = db.collection(COLLECTION_ID)
        .withConverter(listConverter)
        .doc(DOC_ID);

    return db.runTransaction((transaction) => {
        return transaction
            .get(docRef)
            .then((doc) => {
                let key = "users." + newUser.id;
                transaction.update(docRef, {
                    [`${key}`]: newUser.toObject()
                })
            });
    }).then(() => {
        console.log("Data appended successfully");
    }).catch((error) => {
        console.log("Error: " + error);
    })
}

let userCollection = {};

function loadUsers() {
    db.collection(COLLECTION_ID)
        .withConverter(listConverter)
        .doc(DOC_ID)
        .get()
        .then((doc) => {
            userCollection = doc.data().users;
            let users = Object.keys(userCollection).map((id) => userCollection[id].toObject());
            renderTable(users);
        })
}

function register() {
    if (faceclaim.value && clanname.value && yourname.value && prodigium.value && status.value) {
        var biodata = {
            faceClaim: faceclaim.value,
            clanName: clanname.value,
            name: yourname.value,
            prodigy: prodigium.value,
            statusOfFaceClaim: status.value
        };

        user = biodata;

        db.collection("NPA-DB")
            .add(biodata)
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
                alert("Data successfully registered! Your data will be displayed after 1x24 hour.\nIf no changes present, please contact admin to make sure your data is up-to-date"); faceclaim.value = "";
                clanname.value = "";
                yourname.value = "";
                prodigium.value = "";
                status.value = "";

                location.reload();
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
                alert(error);
            })
    } else {
        alert("All fields should be filled!");
    }
}

registerbutton.addEventListener("click", register);

var table;

function renderTable(dataset) {
    table = $('#table_id').DataTable({
        paging: true,
        data: dataset,
        autoWidth: false,
        dom: '<"top"i>rt<"bottom"><"clear">',
        columnDefs: [{
            targets: 0,
            width: "20%",
            render: function (data, type, row, meta) {
                if (type === 'display') {
                    data = '<span class="material-icons mdl-button margin-r8" onClick="showEditCivitas(\'' + data + '\')">edit</span>' +
                        '<span class="material-icons mdl-button" onClick="deleteCivitas(\'' + data + '\')">delete_forever</span>';
                    // data = '<a href="' + data + '">' + data + '</a>';
                }
                return data;
            }
        }],
        columns: [
            { data: 'id', width: "80px" },
            { data: 'faceClaim' },
            { data: 'firstName' },
            { data: 'lastName' },
            { data: 'cabin' },
            { data: 'weapons' }
        ]
    });


    // setup search
    searchBar.addEventListener("keyup", function (event) {
        table.search(searchBar.value).draw();
    });
}

var queryResult = [];

function loadThenConvert() {
    db.collection("NPA-DB").get()
        .then(function (querySnapshot) {
            // on success, create dataset list
            var i = 0;
            queryResult = []; // reset to empty
            querySnapshot.forEach(function (doc) {
                let student = doc.data();
                queryResult.push({
                    index: i,
                    id: doc.id,
                    faceClaim: student.faceClaim,
                    clanName: student.clanName,
                    name: student.name,
                    prodigy: student.prodigy,
                    statusOfFaceClaim: student.statusOfFaceClaim,
                });
                i++;
            });

            updateDatabase(queryResult);

            // prepare data table
            // prepareTable(queryResult);
        })
        .catch(function (error) {
            alert(error);
        });
}

var preParse = "";
function deleteCivitas(id) {
    let user = userCollection[id];
    if (user) {
        if (confirm("Are you sure you want to delete?")) {
            let docRef = db.collection(COLLECTION_ID)
                .withConverter(listConverter)
                .doc(DOC_ID);

            return db.runTransaction((transaction) => {
                return transaction
                    .get(docRef)
                    .then((doc) => {
                        transaction.update(docRef, {
                            ['users.' + id]: firebase.firestore.FieldValue.delete()
                        })
                    });
            }).then(() => {
                console.log("Data removed successfully");
            }).catch((error) => {
                console.log("Error: " + error);
            })
        }
    }
}


var selectedID = null;

editButton.addEventListener("click", function () {
    onEditClicked();
})

function onEditClicked() {
    submitEditCivitas(selectedID);
    selectedID = null; // Reset
}

function showEditCivitas(id) {
    let civitas = userCollection[id];
    if (civitas) {
        selectedID = id;
        overlay.classList.remove("hidden");
        overlay.classList.add("flex");

        editBox.classList.remove("hidden");
        editBox.classList.add("visible");

        editFace.value = civitas.faceClaim;
        editClan.value = civitas.firstName;
        editName.value = civitas.lastName;
        editProdigy.value = civitas.cabin;
        editStatus.value = civitas.weapons;
    }
}

function submitEditCivitas(id) {
    db.collection("NPA-DB").doc(id)
        .set({
            faceClaim: editFace.value,
            clanName: editClan.value,
            name: editName.value,
            prodigy: editProdigy.value,
            statusOfFaceClaim: editStatus.value
        })
        .then(function () {
            alert("Data successfully changed! Your data will be displayed after 1x24 hour.\nIf no changes present, please contact admin to make sure your data is up-to-date");
            //location.reload();
        })
        .catch(function (error) {
            alert("Error writing document: ", error);
        });
}

function onOverlayClicked(event) {
    if (event.target == overlay) {
        closeOverlay();
    }
}

window.onclick = onOverlayClicked

function saveSingleDataset(data, refresh = false) {
    db.collection("NPA-civitas").doc(DB_ID).set(data)
        .then(() => {
            alert("Database updated");
            if (refresh) {
                location.reload();
            }
        })
        .catch((error) => {
            alert(error);
        });
}

function convertDataset(dataset) {
    var doc = {
        lastUpdate: new Date(),
        civitas: []
    };

    // doc.civitas = dataset.map((student) => student);
    doc.civitas = dataset.reduce((obj, student) => Object.assign(obj, { [student.id]: student }), {});

    saveSingleDataset(doc, true); // convert multidocs to single doc
}

var queryDocument = null;

function updateDatabase(dataset) {
    db.collection("NPA-civitas").doc(DB_ID).get()
        .then((doc) => {
            let students = doc.data();

            // Set/edit existing students
            dataset.forEach((data) => {
                students.civitas[data.id] = data;

                // Delete, if needed
                db.collection("NPA-DB").doc(data.id).delete()
                    .then(() => { console.log("Data " + data.id + "successfully deleted") });
            })

            saveSingleDataset(students, true);
        })
}

function loadSingleDatabase() {
    db.collection(COLLECTION_ID).doc(DOC_ID).get()
        .then(function (doc) {
            queryDocument = doc.data();
            queryResult = Object.keys(queryDocument.users).map((id) => queryDocument.users[id]);
            // prepare data table
            renderTable(queryResult);
        })
        .catch(function (error) {
            alert(error);
        });
}

loadButton.addEventListener("click", () => { loadThenConvert(); });

function dumpToCSV() {
    var output = "ID;Clan;Name;Prodigy;Status";
    queryResult.forEach((user) => {
        var toAppend = "\n" + user.id + ";" + user.clanName + ";" + user.name + ";" + user.prodigy + ";" + user.statusOfFaceClaim;
        output += toAppend
    })
    return output;
}

function closeOverlay() {
    overlayBoxes.forEach((box) => {
        overlay.classList.remove("flex");
        overlay.classList.add("hidden");
        box.classList.remove("visible");
        box.classList.add("hidden");
    })
}

window.onload = loadUsers;