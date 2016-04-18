chrome.runtime.onMessage.addListener(function(req, sender, res) {
  if(req.type == "openNameInput") {
    promptForName(req.name, function(name) {
      res(name);
    });
    return true;
  }
});

function promptForName(name, cb) {
  var form = document.createElement("form");
  form.style.position = "fixed";
  form.style.left = "50%";
  form.style.top = "50%";
  form.style.padding = "16px";
  form.style.transform = "translate3d(-50%, -50%, 0)";
  form.style.backgroundColor = "pink";
  form.style.zIndex = "9999999";
  var label = document.createElement("label");
  label.innerHTML = "Share Name:";
  form.appendChild(label);
  var nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = name;
  form.style.color = "black";
  form.appendChild(nameInput);
  var submitButton = document.createElement("input");
  submitButton.type = "submit";
  form.appendChild(submitButton);
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    e.stopPropagation();
    form.parentElement.removeChild(form);
    cb({name: nameInput.value});
  });
  document.body.appendChild(form);
  nameInput.focus();
}