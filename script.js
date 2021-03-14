const searchBar = document.querySelector("#search-bar");

const overlay = document.querySelector(".overlay");
const overlayBoxes = document.querySelectorAll(".overlay-box");

const registerBox = document.querySelector("#register-box");
const registerForm = {
    firstName: registerBox.querySelector("#first-name"),
    lastName: registerBox.querySelector("#last-name"),
    faceClaim: registerBox.querySelector("#face-claim"),
    cabin: registerBox.querySelector("#cabin"),
    weapon: registerBox.querySelector("#weapon"),
    ability1: registerBox.querySelector("#ability-1"),
    ability2: registerBox.querySelector("#ability-2"),
    ability3: registerBox.querySelector("#ability-3"),
    submit: registerBox.querySelector("#register-button")
}


const editBox = document.querySelector("#edit-box")
const editForm = {
    firstName: editBox.querySelector("#first-name"),
    lastName: editBox.querySelector("#last-name"),
    faceClaim: editBox.querySelector("#face-claim"),
    cabin: editBox.querySelector("#cabin"),
    weapon: editBox.querySelector("#weapon"),
    ability1: editBox.querySelector("#ability-1"),
    ability2: editBox.querySelector("#ability-2"),
    ability3: editBox.querySelector("#ability-3"),
    submit: editBox.querySelector("#edit-button")
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
                    data = `<span class="material-icons mdl-button margin-r8" onClick="showEditUser('${data}')">edit</span>
                    <span class="material-icons mdl-button" onClick="deleteUser('${data}')">delete_forever</span>`;
                }
                return data;
            }
        }],
        columns: [
            { data: 'id', width: "50px" },
            { data: 'firstName' },
            { data: 'lastName' },
            { data: 'faceClaim' },
            { data: 'cabin' },
            { data: 'weapon' },
            { data: 'abilities.0' },
            { data: 'abilities.1' },
            { data: 'abilities.2' }
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


function showEditUser(id) {
    let user = userCollection[id];
    if (user) {
        selectedID = id;
        overlay.classList.remove("hidden");
        overlay.classList.add("flex");

        editBox.classList.remove("hidden");
        editBox.classList.add("visible");

        editForm.firstName.value = user.firstName;
        editForm.lastName.value = user.lastName;
        editForm.faceClaim.value = user.faceClaim;
        editForm.cabin.value = user.cabin;
        editForm.weapon.value = user.weapon;
        editForm.ability1.value = user.abilities[0];
        editForm.ability2.value = user.abilities[1];
        editForm.ability3.value = user.abilities[2];
        editForm.submit.addEventListener("click", () => { submitEditUser(id); });
    }
}

function submitEditUser(id) {
    var existingUser = null;
    if (editForm.firstName.value &&
        editForm.lastName.value &&
        editForm.faceClaim.value &&
        editForm.cabin.value &&
        editForm.weapon.value &&
        editForm.ability1.value
        ) {
        existingUser = new User({
            id: id,
            firstName: editForm.firstName.value,
            lastName: editForm.lastName.value,
            cabin: editForm.cabin.value,
            faceClaim: editForm.faceClaim.value,
            weapon: editForm.weapon.value,
            abilities: [
                editForm.ability1.value,
                editForm.ability2.value,
                editForm.ability3.value
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
                let key = "users." + existingUser.id;
                transaction.update(docRef, {
                    [`${key}`]: existingUser.toObject()
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

window.onclick = onOverlayClicked

function onOverlayClicked(event) {
    if (event.target == overlay) {
        closeOverlay();
    }
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

let hyomin = new User({
    firstName: "Choi",
    lastName: "HHyomin",
    cabin: "Athena",
    faceClaim: "Chuuunibyou",
    weapon: "Overture (a transforming gunblade) or Bisecting Shears (a pair siderite blades)",
    abilities: [
        "Inspiring Wisdom (rally people and boost morale)",
        "Inventor Mind (brilliant mind in military tools, inventing new effective tools with enhancement for unexpected situations)",
        "Terrain Manipulation (an ability to re-architect the contour of terrain to give strategic advantages in battlefield)"
    ]
});

function dummySeed() {
    let docRef = db.collection(COLLECTION_ID)
        .withConverter(listConverter)
        .doc(DOC_ID);

    return db.runTransaction((transaction) => {
        return transaction
            .get(docRef)
            .then((doc) => {
                let key = "users." + hyomin.id;
                transaction.update(docRef, {
                    [`${key}`]: hyomin.toObject()
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