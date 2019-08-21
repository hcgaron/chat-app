const socket = io() // allows us to connect to the websocket server

// Elements
const $messageForm = document.getElementById('messageForm');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');

const $locationButton = document.getElementById('send-location');

const $messages = document.getElementById('messages');

// Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    
   // Visible height
   const visibleHeight = $messages.offsetHeight;

   // Height of messages container
   const containerHeight = $messages.scrollHeight;

   // How far have I scrolled?
   const scrollOffset = $messages.scrollTop + visibleHeight;

   // were we looking at the bottom before the new message arrived?
   if (containerHeight - newMessageHeight <= scrollOffset) {
       $messages.scrollTop = $messages.scrollHeight; // scroll to bottom
   }
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})



// listen for location events
socket.on('locationMessage', (message) => {
    // console.log(location)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        locationURL: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled')
    // disable form
    let message = event.target.message.value; // same as below, just another way
    // const msg = document.getElementByName('msg').value;
    if (message.trim() != '') {
        socket.emit('sendMessage', message, (error) => {
            // enable form

            if (error) {
                return console.log(error)
            }

            console.log('Message delivered')
        })
        $messageFormInput.value = '';
    }
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.focus();
})


$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }
    
    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location Shared!');
            $locationButton.removeAttribute('disabled');
        })
    });
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
        console.log(error)
    }
})
