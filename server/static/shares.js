document.addEventListener("DOMContentLoaded", function() {
  var removalButtons = document.getElementsByClassName("remove");
  sharesList = document.getElementById("shareslist");
  for(var i = 0; i < removalButtons.length; i++) {
    var el = removalButtons[i];
    el.addEventListener("click", removeHandler);
  }
})

function remove(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.send();
}

function removeHandler(e) {
  e.preventDefault();
  e.stopPropagation();
  remove(e.target.href);
  e.target.parentElement.parentElement.removeChild(e.target.parentElement);
  if(sharesList.childNodes.length === 0) {
    sharesList.innerHTML = "<h3 class='noPosts'>No Posts Left :'(</h3>";
  }
}

function pollPosts() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", `/shares/${user}.json`, true)
  xhr.onload = function() {
    if(this.status == 200) {
      buildShares(JSON.parse(this.responseText));
    }
  }
  xhr.send();
}

function buildShares(items) {
  for(var i = highestIndex + 1; i < items.length; i++) {
    if(i > highestIndex) highestIndex = i;
    var item = items[i];
    if(item.removed)
      continue;
    var el = document.createElement("li");
    var index = document.createElement("a");
    index.classList.add("index");
    index.innerHTML = i;
    index.href = `/shares/${user}#share-${i}`;
    var link = document.createElement("a");
    var removeLink = document.createElement("a");
    removeLink.addEventListener("click", removeHandler);
    link.innerHTML = item.name;
    link.href = item.url;
    removeLink.innerHTML = "X";
    removeLink.href = `/remove/${user}/${i}`
    removeLink.classList.add("remove");
    el.appendChild(index);
    el.appendChild(link);
    el.appendChild(removeLink);
    var noPosts = document.getElementsByClassName("noPosts");
    if(noPosts.length > 0) {
      for(var j = 0 ; j < noPosts.length; j++) {
        noPosts[j].parentElement.removeChild(noPosts[j])
      }
    }
    console.log(i, item, highestIndex);
    sharesList.appendChild(el);
  }
}