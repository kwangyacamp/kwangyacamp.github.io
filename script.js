const searchBar = document.querySelector("#search-bar");

const overlay = document.querySelector(".overlay");
const overlayBoxes = document.querySelectorAll(".overlay-box");

var downloadButton = document.querySelector("#download-button");

const registerBox = document.querySelector("#register-box");
const registerForm = {
    fullName: registerBox.querySelector("#full-name"),
    alias: registerBox.querySelector("#alias"),
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
    fullName: editBox.querySelector("#full-name"),
    alias: editBox.querySelector("#alias"),
    faceClaim: editBox.querySelector("#face-claim"),
    cabin: editBox.querySelector("#cabin"),
    weapon: editBox.querySelector("#weapon"),
    ability1: editBox.querySelector("#ability-1"),
    ability2: editBox.querySelector("#ability-2"),
    ability3: editBox.querySelector("#ability-3"),
    status: editBox.querySelector("#status"),
    submit: editBox.querySelector("#edit-button")
}

const Status = {
    ACTIVE: "🟢 Active",
    INACTIVE: "🔴 Inactive",
    IN_REST: "⚪ In Rest" 
}

class User {
    constructor(user) {
        this.fullName = user.fullName;
        this.alias = user.alias;
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

        if (user.status) {
            this.status = user.status;
        } else {
            this.status = Status.ACTIVE;
        }
    }

    toObject() {
        return {
            id: this.id,
            fullName: this.fullName,
            alias: this.alias,
            cabin: this.cabin,
            faceClaim: this.faceClaim,
            weapon: this.weapon,
            abilities: this.abilities,
            status: this.status
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
    fullName: "Jin Sakai",
    alias: "Ghost",
    cabin: "Ghost",
    faceClaim: "imgur.com",
    weapon: "Katana & Tanto",
    abilities: ["Heavenly Strike", "Perfect Parry", "Perfect Dodge"]
});
let shimura = new User({
    fullName: "Lord Shimura",
    alias: "Jito",
    cabin: "Samurai",
    faceClaim: "imgur.com",
    weapon: "Katana",
    abilities: ["Honor"]
});

function registerUser() {
    var newUser = null;
    if (registerForm.fullName.value &&
        registerForm.alias.value &&
        registerForm.faceClaim.value &&
        registerForm.cabin.value &&
        registerForm.weapon.value &&
        registerForm.ability1.value
        ) {
        newUser = new User({
            fullName: registerForm.fullName.value,
            alias: registerForm.alias.value,
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
let flattenUsers = [];

function loadUsers() {
    db.collection(COLLECTION_ID)
        .withConverter(listConverter)
        .doc(DOC_ID)
        .get()
        .then((doc) => {
            userCollection = doc.data().users;
            flattenUsers = Object.keys(userCollection).map((id) => userCollection[id].toObject());
            onLoadUserSuccess(flattenUsers);
            renderTable(flattenUsers);
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
            { data: 'id', width: "65px" },
            { data: 'status' },
            { data: 'fullName' },
            { data: 'alias' },
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

        editForm.fullName.value = user.fullName;
        editForm.alias.value = user.alias;
        editForm.faceClaim.value = user.faceClaim;
        editForm.cabin.value = user.cabin;
        editForm.weapon.value = user.weapon;
        editForm.ability1.value = user.abilities[0];
        editForm.ability2.value = user.abilities[1];
        editForm.ability3.value = user.abilities[2];
        editForm.status.value = user.status;
        editForm.submit.addEventListener("click", () => { submitEditUser(id); });
    }
}

function submitEditUser(id) {
    var existingUser = null;
    if (editForm.fullName.value &&
        editForm.alias.value &&
        editForm.faceClaim.value &&
        editForm.cabin.value &&
        editForm.weapon.value &&
        editForm.ability1.value
        ) {
        existingUser = new User({
            id: id,
            fullName: editForm.fullName.value,
            alias: editForm.alias.value,
            cabin: editForm.cabin.value,
            faceClaim: editForm.faceClaim.value,
            weapon: editForm.weapon.value,
            abilities: [
                editForm.ability1.value,
                editForm.ability2.value,
                editForm.ability3.value
            ],
            status: editForm.status.value
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
    fullName: "Choi",
    alias: "Hyomin",
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

function onLoadUserSuccess(flattenUsers) {
    downloadButton.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(dumpToCSV(flattenUsers))}`);
}

function dumpToCSV(userList) {
    var output = "ID;Status;Full Name;Alias;Cabin;Face Claim;Weapon;Ability 1; Ability 2; Ability 3";
    userList.forEach((user) => {
        var row = `\n${user.id};${user.status};${user.fullName};${user.alias};${user.cabin};${user.faceClaim};${user.weapon};${user.abilities[0]};${user.abilities[1]};${user.abilities[2]}`;
        output += row;
    })
    return output;
}