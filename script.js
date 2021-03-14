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

const registerForm = {
    firstName: document.querySelector("#first-name"),
    lastName: document.querySelector("#last-name"),
    faceClaim: document.querySelector("#face-claim"),
    cabin: document.querySelector("#cabin"),
    weapon: document.querySelector("#weapon"),
    ability1: document.querySelector("#ability-1"),
    ability2: document.querySelector("#ability-2"),
    ability3: document.querySelector("#ability-3"),
    submit: document.querySelector("#register-button")
}

class User {
    constructor(user) {
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.cabin = user.cabin;
        this.faceClaim = user.faceClaim;
        
        if (!user.id) {
            this.id = this.getID();
        } else {
            this.id = user.id;
        }

        this.weapon = user.weapon;
        this.abilities = [null, null, null];
        if (user.abilities != null && user.abilities.length > 0) {
            user.abilities.forEach((ability, index) => {
                this.abilities[index] = ability;
            })
        }
    }

    toObject() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            cabin: this.cabin,
            faceClaim: this.faceClaim,
            weapon: this.weapon,
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

let ghost = new User({
    firstName: "Jin",
    lastName: "Sakai",
    cabin: "Ghost",
    faceClaim: "imgur.com",
    weapon: "Katana & Tanto",
    abilities: ["Heavenly Strike", "Perfect Parry", "Perfect Dodge"]
});
let shimura = new User({
    firstName: "Lord",
    lastName: "Shimura",
    cabin: "Samurai",
    faceClaim: "imgur.com",
    weapon: "Katana",
    abilities: ["Honor"]
});

function registerUser() {
    var newUser = null;
    if (registerForm.firstName.value &&
        registerForm.lastName.value &&
        registerForm.faceClaim.value &&
        registerForm.cabin.value &&
        registerForm.weapon.value &&
        registerForm.ability1.value
        ) {
        newUser = new User({
            firstName: registerForm.firstName.value,
            lastName: registerForm.lastName.value,
            cabin: registerForm.cabin.value,
            faceClaim: registerForm.faceClaim.value,
            weapon: registerForm.weapon.value,
            abilities: [
                registerForm.ability1.value,
                registerForm.ability2.value,
                registerForm.ability3.value
            ]
        });
    } else {
        alert("All mandatory fields should be filled!");
        return;
    }
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
        location.reload();
    }).catch((error) => {
        console.log("Error: " + error);
        alert(`Error: ${error}`);
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

registerForm.submit.addEventListener("click", registerUser);

var table;

function renderTable(dataset) {
    table = $('#table_id').DataTable({
        paging: true,
        data: dataset,
        autoWidth: false,
        dom: '<"top"i>rt<"bottom"><"clear">',
        columnDefs: [{
            targets: 0,
            render: function (data, type, row, meta) {
                if (type === 'display') {
                    data = `<span class="material-icons mdl-button margin-r8" onClick="showEditCivitas('${data}')">edit</span>
                    <span class="material-icons mdl-button" onClick="deleteUser('${data}')">delete_forever</span>`;
                }
                return data;
            }
        }],
        columns: [
            { data: 'id', width: "50px" },
            { data: 'faceClaim' },
            { data: 'firstName' },
            { data: 'lastName' },
            { data: 'cabin' },
            { data: 'abilities.0' },
            { data: 'abilities.1' },
            { data: 'abilities.2' },
            { data: 'weapon' }
        ]
    });


    // setup search
    searchBar.addEventListener("keyup", function (event) {
        table.search(searchBar.value).draw();
    });
}

function deleteUser(id) {
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
                location.reload();
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
        editStatus.value = civitas.weapon;
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