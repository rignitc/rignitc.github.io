document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const nameField = document.querySelector(
        '.contact-form input[name="name"]'
    );
    const emailField = document.querySelector(
        '.contact-form input[name="email"]'
    );
    const messageField = document.querySelector(
        '.contact-form textarea[name="message"]'
    );
    if (params.has("name")) nameField.value = params.get("name");
    if (params.has("email")) emailField.value = params.get("email");
    if (params.has("message")) messageField.value = params.get("message");
});