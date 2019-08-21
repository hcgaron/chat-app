const users = [];

// addUser, removeUser, getUser, getUsersInRoom
const addUser = ({ id, username, room }) => { // id provided by socket.io
    // Clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) => {
        // no duplicate usernames in the same room
        return user.room === room && user.username === username
    })

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is in use'
        }
    }

    // Store user
    const user = { id, username, room };
    users.push(user);
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id // -1 if no match, 1 if match found
    })

    if (index != -1) {
        return users.splice(index, 1)[0] // getting the individual user to remove
    }
}

const getUser = (id) => {
    return users.find((user) => {
        return user.id === id;
    })
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    return users.filter((user) => {
        return user.room === room;
    } )
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}