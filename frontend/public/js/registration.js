document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        if (e.target.password.value !== e.target.confirmPassword.value)
            setMessage("Both passwords must be same", "alert alert-danger d-block mt-3");
        else {
            const response = await axios.post('/register', new FormData(e.target), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.data;

            if (data.success) {
                setMessage(data.message+", please wait", "alert alert-success d-block mt-3");
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 7);
                document.cookie = `user=${data.user}; expires=${expirationDate.toUTCString()}`;
                document.cookie = `token=${data.token}; expires=${expirationDate.toUTCString()}`;
                setTimeout(()=>{
                    window.location.href = '/';
                }, 2000);
            }
        }
    } catch (error) {
        console.log(error);
        setMessage(error.response.data.error, "alert alert-danger d-block mt-3");
    }
});

function setMessage(message, type) {
    const msg = document.getElementById('message');
    msg.innerText = message;
    msg.setAttribute('class', type);

    setTimeout(() => {
        msg.setAttribute('class', 'd-none');
    }, 3000);
}