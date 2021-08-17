const searchBar = document.querySelector("#search-bar");

const overlay = document.querySelector(".overlay");
const overlayBoxes = document.querySelectorAll(".overlay-box");

var downloadButton = document.querySelector("#download-button");

const addUserButton = document.querySelector("#show-register-form");
const signInButton = document.querySelector("#sign-in-button");
signInButton.onclick = showLoginForm;

const signOutButton = document.querySelector("#sign-out-button");
signOutButton.onclick = logout;

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

const editBox = document.querySelector("#edit-box");
const editForm = {
    fullName: editBox.querySelector("#edit-full-name"),
    alias: editBox.querySelector("#edit-alias"),
    faceClaim: editBox.querySelector("#edit-face-claim"),
    cabin: editBox.querySelector("#edit-cabin"),
    weapon: editBox.querySelector("#edit-weapon"),
    ability1: editBox.querySelector("#edit-ability-1"),
    ability2: editBox.querySelector("#edit-ability-2"),
    ability3: editBox.querySelector("#edit-ability-3"),
    status: editBox.querySelector("#edit-status"),
    submit: editBox.querySelector("#edit-button")
}

const loginBox = document.querySelector("#login-box");

const bindingBox = document.querySelector("#binding-box");
const bindingForm = {
    text: document.querySelector("#binding-box-caption"),
    cancel: document.querySelector("#binding-cancel"),
    confirm: document.querySelector("#binding-confirm"),
};
const bindingText = document.querySelector("#binding-box-caption");
const welcomeMessage = document.querySelector("#welcome-message");

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        signInButton.classList.add("hidden");
        signInButton.classList.remove("inline");

        signOutButton.classList.add("inline");
        signOutButton.classList.remove("hidden");

        var uid = user.uid;
        console.log(`UID: ${uid}`);
        currentUser = user;
        queryUser(uid).then(() => {
            welcomeMessage.innerHTML = currentAvatar ? "" : "Claim your character in table below or add new character";
            addUserButton.classList.add(currentAvatar ? "hidden" : "inline");
            addUserButton.classList.remove(currentAvatar ? "inline" : "hidden");

            asyncPromise();
        });
    } else {
        welcomeMessage.innerHTML = "Are you new? Sign in to create character or claim your existing character.";
        signInButton.classList.remove("hidden");
        signInButton.classList.add("inline");
        addUserButton.classList.remove("inline");
        addUserButton.classList.add("hidden");

        currentUser = null;
        currentAvatar = null;

        asyncPromise();
    }
});

const Status = {
    ACTIVE: "🟢 Active",
    INACTIVE: "🔴 Inactive",
    IN_REST: "⚪ In Rest"
}

function padNumber(digit) {
    return digit > 9 ? `${digit}` : `0${digit}`;
}

function padMillis(digit) {
    return digit > 99 ? `${digit}` : digit > 9 ? `0${digit}` : `00${digit}`;
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

        if (user.owner) {
            this.owner = user.owner;
        } else {
            this.owner = "";
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
            status: this.status,
            owner: this.owner,
        }
    }

    toFlatObject() {
        return {
            id: this.id,
            status: this.status,
            fullName: this.fullName,
            alias: this.alias,
            cabin: this.cabin,
            faceClaim: this.faceClaim,
            weapon: this.weapon,
            ability1: this.abilities[0],
            ability2: this.abilities[1],
            ability3: this.abilities[2],
        }
    }

    getID() {
        let today = new Date();
        let year = `${today.getFullYear()}`;
        let month = padNumber(today.getMonth() + 1);
        let date = padNumber(today.getDate());
        let hours = padNumber(today.getHours());
        let minutes = padNumber(today.getMinutes());
        let seconds = padNumber(today.getSeconds());
        let millis = padMillis(today.getMilliseconds());
        return `${year}${month}${date}-${hours}:${minutes}:${seconds}:${millis}`;
    }

    getGUID() {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
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
const ACCOUNT_ID = "accounts";

let mark = new User({
    id: "20210318-15:20:04:300",
    fullName: "Lee Mark",
    alias: "@thunderonmark",
    cabin: "Zeus",
    faceClaim: "Lee Mark (NCT)",
    weapon: "a Roman Gladius made of Imperial Gold.",
    abilities: ["All the monsters want him to be perished.", "Undeniably powerful.", "Can cast a lightning with his fingers."]
});
let haechan = new User({
    id: "20210318-15:40:58:035",
    fullName: "Lee Haechan",
    alias: "Coming soon.",
    cabin: "UNCLAIMED",
    faceClaim: "Lee Haechan (NCT)",
    weapon: "Coming soon.",
    abilities: ["Coming soon.", "Coming soon.", "Coming soon."]
});

function registerUser() {
    var newUser = null;
    let owner = currentUser != null ? currentUser.uid : null;
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
            ],
            owner: owner
        });
    } else {
        alert("All mandatory fields should be filled!");
        return;
    }
    let docID = `db_${registerForm.cabin.value.toLowerCase()}`;
    let docRef = db.collection(COLLECTION_ID)
        .withConverter(listConverter)
        .doc(docID);
    let accountRef = db.collection(COLLECTION_ID).doc(ACCOUNT_ID);

    return db.runTransaction((transaction) => {
        return transaction
            .get(docRef)
            .then((doc) => {
                let key = "users." + newUser.id;
                transaction.update(docRef, {
                    [`${key}`]: newUser.toObject()
                })

                if (currentUser) {
                    transaction.update(accountRef, {
                        [`accounts.${currentUser.uid}`]: newUser.id
                    });
                }
            });
    }).then(() => {
        console.log("Data appended successfully");
        location.reload();
    }).catch((error) => {
        console.log("Error: " + error);
        alert(`Error: ${error}`);
    });
}

function seedUser(newUser) {
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

let db_cabin_id = [
    "Aphrodite",
    "Apollo",
    "Ares",
    "Athena",
    "Demeter",
    "Dionysus",
    "Hephaestus",
    "Hermes",
    "Casts"
];

let asyncOutput = [];

function asyncPromise(callback = null) {
    let promises = db_cabin_id.map((cabin) =>
        db.collection(COLLECTION_ID)
            .withConverter(listConverter)
            .doc(`db_${cabin.toLowerCase()}`)
            .get()
    );

    flattenUsers = [];

    Promise.all(promises)
        .then(snapshots => {
            snapshots.forEach((snapshot, i) => {
                let userMap = snapshot.data().users;
                let userList = Object.keys(userMap)
                    .map((id) => userMap[id])
                    .sort((a, b) => a.id > b.id ? 0 : -1);

                flattenUsers = flattenUsers.concat(userList);
            });

            userCollection = flattenUsers.reduce((map, user) => (map[user.id] = user, map), {});
            renderTable(flattenUsers);
        });
}

function filterToMap(dataset, filterBy) {
    let filtered = dataset.filter((user) => user.cabin == filterBy);
    let converted = filtered.reduce((map, user) => (map[user.id] = user, map), {});
    return converted;
}

function storeFiltered(dataset, filterBy) {
    let map = filterToMap(dataset, filterBy);
    let docID = `db_${filterBy.toLowerCase()}`;
    db.collection(COLLECTION_ID).doc(docID).set({
        users: map
    }).then(() => console.log(`Stored to: ${docID}`));
}

function loadUsers() {
    db.collection(COLLECTION_ID)
        .withConverter(listConverter)
        .doc(DOC_ID)
        .get()
        .then((doc) => {
            userCollection = doc.data().users;
            flattenUsers = Object.keys(userCollection).map((id) => userCollection[id].toObject());
            flattenUsers.sort((a, b) => a.id > b.id ? 0 : -1);
            renderTable(flattenUsers);
        })
}

registerForm.submit.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    registerUser();
});

var table;

function renderTable(dataset) {
    table = $('#table_id').DataTable({
        paging: false,
        data: dataset,
        order: [[0, "asc"]],
        autoWidth: false,
        dom: '<"top"i>rt<"bottom"><"clear">',
        columns: [
            {
                data: 'id', width: "65px",
                render: (data, type, row, meta) => {
                    let blacklist = ['@thunderonmark', '@onejsoul', '@shotarobs', '@jianujner', '@wingedchan', '@yangrips', '@jaemyrtle'];
                    let isOwner = !!currentUser && currentUser.uid == row.owner;
                    let isEditAllowed = isOwner && !blacklist.includes(row.alias)
                    let isClaimAllowed = !blacklist.includes(row.alias) && !row.owner && !currentAvatar && currentUser;

                    return `<div class="user-id">${data}</div>` +
                        (!isEditAllowed ? '' : `<span class="material-icons mdl-button margin-r8" onClick="showEditUser('${data}')">edit</span>`) +
                        // `<span class="material-icons mdl-button" onClick="deleteUser('${data}')">delete_forever</span><br/>` +
                        (isClaimAllowed ? `<span class="material-icons mdl-button" onClick="showBindUser('${data}')">person_add_alt</span><br/>` : '');
                }
            },
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
    searchBar.addEventListener("keyup", debounce(() => table.search(searchBar.value).draw()));
}

let i = 0;

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function deleteUser(id) {
    let user = userCollection[id];
    let isCast = ["lee jeno", "lee mark", "osaki shotaro", "huang renjun", "liu yangyang", "lee jaemin", "lee haechan"].includes(user.fullName.toLowerCase());
    if (user && !isCast) {
        if (confirm("Are you sure you want to delete?")) {
            let docID = `db_${user.cabin.toLowerCase()}`;
            let docRef = db.collection(COLLECTION_ID)
                .withConverter(listConverter)
                .doc(docID);
            let accountRef = db.collection(COLLECTION_ID)
                .doc(ACCOUNT_ID);

            return db.runTransaction((transaction) => {
                return transaction
                    .get(docRef)
                    .then((doc) => {
                        transaction.update(docRef, {
                            ['users.' + id]: firebase.firestore.FieldValue.delete()
                        });

                        let uid = currentUser ? currentUser.uid : null;
                        if (uid) {
                            transaction.update(accountRef, {
                                [`accounts.${uid}`]: firebase.firestore.FieldValue.delete()
                            });
                        }
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

function showRegisterUser() {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");

    registerBox.classList.remove("hidden");
    registerBox.classList.add("visible");
}

addUserButton.onclick = showRegisterUser;

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
        editForm.submit.onclick = () => {
            event.preventDefault();
            event.stopPropagation();
            submitEditUser(id);
        };
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
            status: editForm.status.value,
            owner: currentUser.uid
        });
    } else {
        alert("All mandatory fields should be filled!");
        return;
    }
    let docID = `db_${editForm.cabin.value.toLowerCase()}`;

    let docRef = db.collection(COLLECTION_ID)
        .withConverter(listConverter)
        .doc(docID);

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

overlay.onclick = closeOverlay;
overlayBoxes.forEach(box => {
    box.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
    })
});

function closeOverlay() {
    overlayBoxes.forEach((box) => {
        overlay.classList.remove("flex");
        overlay.classList.add("hidden");
        box.classList.remove("visible");
        box.classList.add("hidden");
    })
}

function showLoginForm() {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    loginBox.classList.remove("hidden");
    loginBox.classList.add("visible");
}

function logout() {
    firebase.auth().signOut().then(() => {
        location.reload();
    })
}

function bindUser(avatarID, user = currentUser) {
    let uid = currentUser.uid;
    let accountRef = db.collection(COLLECTION_ID).doc(ACCOUNT_ID);

    let avatar = userCollection[avatarID];
    let avatarRef = db.collection(COLLECTION_ID).doc(`db_${avatar.cabin.toLowerCase()}`);

    // Bind
    avatar.owner = uid;

    return db.runTransaction((transaction) => {
        return transaction
            .get(accountRef)
            .then((doc) => {
                transaction.update(accountRef, {
                    [`accounts.${uid}`]: avatarID
                });

                transaction.update(avatarRef, {
                    [`users.${avatarID}`]: avatar.toObject()
                });
            });
    }).then(() => {
        alert(`User ${currentUser.displayName} successfully bound to ${avatar.fullName}`);
        location.reload();
    }).catch((error) => {
        console.log("Error: " + error);
        alert(`Error: ${error}`);
    })
}

function showBindUser(avatarID) {
    overlay.classList.remove("hidden");
    overlay.classList.add("flex");
    bindingBox.classList.remove("hidden");
    bindingBox.classList.add("visible");

    let accountName = currentUser.displayName;
    let avatarName = userCollection[avatarID].fullName;

    bindingForm.text.innerHTML = `Hi, ${accountName}<br/><br/>
        DO NOT CLAIM THIS CHARACTER (${avatarName}), <b>IF IT IS NOT YOURS</b>.<br/>
        Are you sure you want to continue?`;
    bindingForm.confirm.onclick = () => bindUser(avatarID);
    bindingForm.cancel.onclick = closeOverlay;
}

// window.onload = loadUsers;
window.onload = () => {
    firebaseLogin('#login-box', (authResult) => {
        location.reload();
    });
}
downloadButton.onclick = () => { dumpToExcel(userCollection) }

function dumpToExcel(userCollection) {
    let workbook = XLSX.utils.book_new();
    workbook.Props = {
        Title: "Kwangya Camp Database",
        Subject: "Database",
        Author: "Mr. J",
        CreatedDate: new Date()
    };
    workbook.SheetNames.push("Trainees");

    let header = new User({
        id: "ID",
        fullName: "Full Name",
        status: "Status",
        alias: "Alias",
        cabin: "Cabin",
        faceClaim: "Face Claim",
        weapon: "Weapons",
        abilities: [
            "Ability 1",
            "Ability 2",
            "Ability 3"
        ]
    });
    let withHeader = [header.toFlatObject()].concat(Object.keys(userCollection).map((id) => userCollection[id].toFlatObject()));

    var worksheet = XLSX.utils.json_to_sheet(withHeader,
        { header: ["id", "status", "fullName", "alias", "cabin", "faceClaim", "weapon", "ability1", "ability2", "ability3"], skipHeader: true }
    );

    workbook.Sheets["Trainees"] = worksheet;
    var exportedFile = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    saveAs(new Blob([s2ab(exportedFile)], { type: "application/octet-stream" }), 'kwangya-camp-database.xlsx');
}

function s2ab(s) {
    var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
    var view = new Uint8Array(buf);  //create uint8array as viewer
    for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
    return buf;
}