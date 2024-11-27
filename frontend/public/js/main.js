function getCookie(name) {
  const cookieValue = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return cookieValue ? cookieValue.pop() : '';
}

let socket;

if (!socket)
  socket = io();

const user = getCookie('user');
const token = getCookie('token');

socket = io({
  query: {
    token
  },
});

const getChats = async () => {
  const fetch = localStorage.getItem('fetch');
  if (fetch === 'false')
    return;
  try {
    const response = await axios.get('/get-chats');
    const data = await response.data;
    if (data.success) {
      localStorage.setItem('chats', JSON.stringify(data));
      localStorage.setItem('fetch', 'false');
      setChats();
    } else {
      document.getElementById('chats-list').innerHTML = `<div class="alert alert-primary" role="alert">
            <i class="bi bi-ban"></i> Nothing to show
          </div>`;
    }
  } catch (error) {
    console.log(error);
  }
}

function setChats() {
  setTimeout(() => {
    const chats = JSON.parse(localStorage.getItem('chats')).chats;

    if (chats) {
      let html = '';
      chats.forEach((chat) => {
        html += `<li class="list-group-item d-flex justify-content-between align-items-start" id=${chat._id}>
                    <div class="ms-2 me-auto">
                        <div class="fw-bold truncate">${chat.groupName}</div>
                        <p class='truncate'><small>${chat.groupDescription}</small></p>
                    </div>
                </li>`;
      });

      document.getElementById('chats-list').innerHTML = html;
      document.getElementById('chats-list').addEventListener('click', showChat);
    }
  }, 2000);
}

async function showChat(e) {
  if (e.target.tagName === 'LI') {
    try {
      const chatId = e.target.id;
      const chats = JSON.parse(localStorage.getItem('chats')).chats;
      let chat = chats.filter((chat) => {
        return chat._id === chatId;
      });

      setChat(chat[0]);
      if (window.screen.width < 768) {
        document.getElementById('chat-body').style.display = 'block';
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('controlls').style.display = 'none';
      }

    } catch (error) {
      alert('Something went wrong');
      console.log(error);
    }
  }
}


document.addEventListener('DOMContentLoaded', async (e) => {
  getChats();
  setChats();
});

const chatBody = document.getElementById('chat-body');
chatBody.style.visibility = 'hidden';

function setChat(chat) {
  localStorage.setItem('ci', chat._id);
  socket.emit('join', { chatId: chat._id });
  const html = `<div class="row">
    <div class="col" id="chat">
      <div class="template text-white" id="template">
        <div class="chat-box mb-3" id="chat-box">
          <div class="chat-head bg-dark p-2 ps-3 d-flex gap-2">
            <div class="group-icon text-white fs-2">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="group-status d-flex flex-column">
              <p class="m-0 p-0">${chat.groupName}</p>
              <p class="m-0 p-0"><small>${chat.groupDescription}</small></p>
            </div>
            <div>
              <i class="bi bi-sliders" data-bs-toggle="modal" data-bs-target="#staticBackdrop" onclick="groupControlls(event)"></i>

            </div>
            <i class="bi bi-x text-danger fs-4 d-none " id="btn-show-sidebar" onclick="showSideBar(event)"></i>
          </div>
          <div class="chat">
            <div id="message-box" class="message-box d-flex flex-column align-items-start p-3 gap-3">

            </div>
          </div>
        </div>
        <form id="message-form" onsubmit="sendMessage(event)">
        <div class="input-group px-2">
        <input type="text" name="message" id="message" autocomplete="off" class="form-control"
        placeholder="Type Message" aria-label="Recipient's username" aria-describedby="button-addon2">
        <button type="button" class="btn btn-warning" data-bs-toggle="modal" data-bs-target="#fileModal"><i class="bi bi-paperclip"></i></button>
      <button class="btn btn-primary" type="submit" id="button-addon2"><strong><i class="bi bi-send"></i> Send</strong></button>
      </div>
        </form>
      </div>
    </div>
  </div>`;



  let messages = ``;
  chat.messages.forEach((msg) => {
    if (msg.isAttachment) {
      messages += `<div class="message d-flex flex-column">
      <span class="fs-user">${msg.sender}</span>
      <a class="nav-link" href='${msg.link}' target="_blank" download><i class="bi bi-file-earmark-arrow-down-fill"></i> ${msg.content}<a/> 
    </div>`;
    }
    else {
      messages += `<div class="message d-flex flex-column">
    <span class="fs-user">${msg.sender}</span>
    <div>${msg.content}</div>
    </div>`;
    }
  });

  chatBody.innerHTML = html;
  document.getElementById('message-box').innerHTML = messages;
  chatBody.style.visibility = 'visible';
  document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
}

const showSideBar = (e) => {
  document.getElementById('chat-body').style.display = 'none';
  document.getElementById('sidebar').style.display = 'block';
  document.getElementById('controlls').style.display = 'flex';
};

const groupControlls = async (event) => {
  try {
    const chatId = localStorage.getItem('ci');
    const response = await axios.get(`/get-chat/${chatId}`);
    const data = response.data;
    const chat = data.chat;
    const members = data.members;
    let memberHtml = '';

    members.forEach((member, index) => {
      if (member.isAdmin) {
        memberHtml += `<li class="list-group-item bg-light text-dark">${index + 1}. <strong>${member.userName}</strong> <small class='text-success'> ~admin</small></li>`;
      } else {
        memberHtml += `<li class="list-group-item bg-light text-dark">${index + 1}. <strong>${member.userName} - <div class="btn-group" role="group" aria-label="Basic mixed styles example">
        <button data-bs-ci=${member.chatId} data-bs-ui=${member.userId} onclick="makeAdmin(event)" type="button" class="btn btn-sm btn-warning">Make Admin</button>
        <button data-bs-ci=${member.chatId} data-bs-ui=${member.userId} onclick="removeMember(event)" type="button" class="btn btn-sm btn-danger"><i data-bs-ci=${member.chatId} data-bs-ui=${member.userId} onclick="removeMember(event)" class="bi bi-trash3-fill"></i></button>
      </div></li>`;
      }
    });

    if (data.success) {
      let html = `<div class="modal-content">
    <div class="modal-header">
      <h1 class="modal-title fs-5" id="staticBackdropLabel">${chat.groupName}</h1>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
    <p><strong>Description:<br/> </strong>${chat.groupDescription}</p>
    <p><strong>Share Join Link:<br/> </strong><a href="#" class="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover">${data.joinLink}</a></p>
    </div>
    <fieldset>
    <legend class="fs-6 text-center">Add New Member</legend>
    <form class="w-75 border border-1 p-2 ms-auto me-auto mx-3" onsubmit="searchUserByPhone(event)">
        <div class="input-group">
            <input type="text" class="form-control" name="phone" id="phone" placeholder="Phone Number" required>
            <button type="submit" class="input-group-text btn btn-warning">Search</button>
        </div>
        <div class='d-flex flex-column my-2 gap-1' id="search-result"></div>
    </form>
</fieldset>

    <h5 class='p-2'><strong>Members</strong></h5>
    <ul id="members" class="list-group border border-1 p-2">${memberHtml}</ul>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    </div>
  </div>`;

      document.getElementById('modal-dialog').innerHTML = html;
    }
    else alert("Something went wrong");
  } catch (error) {
    console.log(error);
    alert("Internal server error");
  }
}

const makeAdmin = async (event) => {
  const chatId = event.target.getAttribute("data-bs-ci");
  const makeAdminId = event.target.getAttribute("data-bs-ui");

  try {
    const response = await axios.post('/make-admin', { chatId, makeAdminId }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    if (data.success) {
      alert(data.message + ", Please wait");
      setTimeout(() => { window.location.href = '/'; }, 500);
    }
    else
      alert(data.message);
  } catch (error) {
    console.log(error);
    alert(await error.response.data.message);
  }
}

const removeMember = async (event) => {
  event.stopPropagation();
  const chatId = event.target.getAttribute("data-bs-ci");
  const removeMemberId = event.target.getAttribute("data-bs-ui");
  try {
    const response = await axios.post('/remove-member', { chatId, removeMemberId }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    if (data.success) {
      alert(data.message);
      setTimeout(() => { window.location.href = '/'; }, 500);
    }
    else
      alert(data.message);
  } catch (error) {
    console.log(error);
    alert(await error.response.data.message);
  }
}

const searchUserByPhone = async (event) => {
  event.preventDefault();
  try {
    const phoneNumber = document.getElementById('phone').value;
    if (phoneNumber.length < 10 || phoneNumber.length > 10)
      return alert("Please enter valid phone number");

    const response = await axios.post('/search-member-by-phone', { "phone": phoneNumber }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.data;
    document.getElementById('search-result').innerHTML = `
    <h6>Search Result:</h6><br/>
    <p><button onclick="addMember(event)" class='btn btn-outline-success'>${data.member.firstName}</button></p>
  `;
  } catch (error) {
    console.log(error);
    alert(await error.response.data.message);
  }
}


const addMember = async (event) => {
  try {
    const chatId = localStorage.getItem('ci');
    const phone = document.getElementById('phone').value;

    const response = await axios.post('/add-member', { chatId, phone }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.data;
    if (data.success) {
      let html = `<li class="list-group-item bg-light text-dark">*. <strong>${data.member.userName} - <div class="btn-group" role="group" aria-label="Basic mixed styles example">
        <button data-bs-ci=${data.member.chatId} data-bs-ui=${data.member.userId} onclick="makeAdmin(event)" type="button" class="btn btn-sm btn-warning">Make Admin</button>
        <button data-bs-ci=${data.member.chatId} data-bs-ui=${data.member.userId} onclick="removeMember(event)" type="button" class="btn btn-sm btn-danger"><i data-bs-ci=${data.member.chatId} data-bs-ui=${data.member.userId} onclick="removeMember(event)" class="bi bi-trash3-fill"></i></button>
      </div></li>`;
      socket.emit('add-member', { added: true });
      document.getElementById('members').innerHTML += html;
      alert(data.message);
    }
    else
      alert(data.message);
  } catch (error) {
    console.log(error);
  }
}

socket.on('member-added', () => {
  localStorage.setItem('fetch', 'true');
  window.location.reload();
});

function sendMessage(e) {
  e.preventDefault();
  let msg = document.getElementById('message');
  const chatId = localStorage.getItem('ci');
  socket.emit('groupChat', { user: user, chatId: chatId, msg: { content: msg.value, isAttachment: false }, token: token });
  msg.value = '';
}

socket.on('message', (message) => {
  console.log(message);
  setLastMessage(message);
});

const setLastMessage = (msg) => {
  const allChats = JSON.parse(localStorage.getItem('chats'));
  const objMessage = msg.content;
  allChats.chats.forEach((chat) => {
    if (chat._id === localStorage.getItem('ci')) {
      chat.messages.push({ sender: msg.sender, content: objMessage.content, isAttachment: objMessage.isAttachment, createdAt: msg.content.createdAt });
    }
  });

  localStorage.setItem('chats', JSON.stringify(allChats));

  let html = `<div class="message d-flex flex-column">
    <span class="fs-user">${msg.sender}</span>
    <div>${objMessage.content}</div>
    </div>`;

  document.getElementById('message-box').innerHTML += html;
  let chatBox = document.getElementById('chat-box');
  chatBox.scrollTop = chatBox.scrollHeight;
}


document.getElementById('send-file-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const fileName = file.name;
    const fileType = file.type;
    console.log(fileName, fileType);

    const response = await axios.post('/generate-presigned-url', { fileName, fileType }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.data;
    const presignedUrl = data.url;
    const objectUrl = data.objectUrl;

    await uploadFile(file, presignedUrl);

    const message = {
      isAttachment: true,
      content: `${fileName}`,
      fileType,
      link: objectUrl,
      timestamp: Date.now()
    }

    sendFileMessage(message);

  } catch (error) {
    console.log(error);
  }
});

async function uploadFile(file, presignedUrl) {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file
  });

  if (!response.ok)
    throw new Error('Error uploading file to S3');
}

const sendFileMessage = async (message) => {
  try {
    if (!socket)
      socket = io();

    const chatId = localStorage.getItem('ci');
    socket.emit('groupChat', { user: user, chatId: chatId, msg: message, token: token });

  } catch (error) {
    console.log(error);
  }
}

socket.on('file-message', (message) => {
  setLastFileMessage(message);
});

const setLastFileMessage = (msg) => {
  const allChats = JSON.parse(localStorage.getItem('chats'));
  const objMessage = msg.content.content;
  allChats.chats.forEach((chat) => {
    if (chat._id === localStorage.getItem('ci'))
      chat.messages.push({ sender: msg.sender, content: JSON.stringify({ content: objMessage.content, isAttachment: objMessage.isAttachment, link: objMessage.link }), createdAt: msg.content.createdAt });
  });

  localStorage.setItem('chats', JSON.stringify(allChats));
  let html = `<div class="message d-flex flex-column">
  <span class="fs-user">${msg.sender}</span>
  <a class="nav-link" href='${objMessage.link}' target="_blank" download><i class="bi bi-file-earmark-arrow-down-fill"></i> ${objMessage.content}<a/> 
</div>`;

  document.getElementById('message-box').innerHTML += html;
  let chatBox = document.getElementById('chat-box');
  chatBox.scrollTop = chatBox.scrollHeight;
}

