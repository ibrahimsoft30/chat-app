const socket = io();

// Elementes
const $messageForm = document.querySelector('#sendMessageForm');
const $messageFormButton = $messageForm.querySelector('button');
const $messageFormInput = $messageForm.querySelector('input');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix: true})

const autoScroll = () =>{
    
    // new message element
    const $newMessage = $messages.lastElementChild;
    // get new message height
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // height of messages container
    const containerHeight = $messages.scrollHeight;

    // the amount of scroll from top
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollWidth;
    }

}
socket.emit('join',{username,room},(error) => {
    if(error){
        alert(error);
        location.href = '/'
    }
});

socket.on('message',(message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll()
});

socket.on('locationMessage',(message) => {
    const html = Mustache.render(urlTemplate,{
        username:message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll()
});

socket.on('roomData',(roomData) => {
    const html = Mustache.render(sidebarTemplate,{
        room: roomData.room,
        users: roomData.users
    });

    $sidebar.innerHTML = html;
})

document.querySelector('#sendMessageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    $messageFormButton.setAttribute('disabled','disabled');
    const message = e.target.elements.message.value;

    socket.emit('sendMessage',message,(error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error){
            return console.log(error);
        }

        console.log('message delivered');
    });
});


$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation Service Is Not Supported On Your Browser');
    }

    $sendLocationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            lat:position.coords.latitude,
            lng:position.coords.longitude,
        },()=>{
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location Sheared');
        });
    });
});