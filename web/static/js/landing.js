
function getImage() {
  return document.getElementById('photo-url').value;
}

(function() {
  document.getElementsByClassName('background')[0].style.backgroundImage = 'url(' + getImage() + ')';
})();

(function() {
  const timeParts = function(d) {
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = ("0" + minutes).slice(-2);
    return {
      hours: hours,
      minutes: minutes,
      ampm: ampm
    };
  };

  var parts = timeParts(new Date());
  document.getElementById('time-hoursminutes').textContent = parts.hours + ':' + parts.minutes;
  document.getElementById('time-ampm').textContent = parts.ampm;
})();

(function() {
  const openImage = function() {
    var link = getImage();
    window.open(link, '_blank');
  };

  document.getElementsByClassName('author')[0].addEventListener('click', openImage);
})();

(function() {
  const openMap = function() {
    var link = document.getElementById('map-url').value;
    window.open(link, '_blank');
  };

  document.getElementsByClassName('location')[0].addEventListener('click', openMap);
})();

(function() {
  const openRepo = function() {
    var link = 'https://github.com/zendamacf/hmpg';
    window.open(link, '_blank');
  };

  document.getElementsByClassName('credit')[0].addEventListener('click', openRepo);
})();

(function() {
  const refresh = function() {
    var link = document.getElementById('refresh-url').value;
    window.location.href = link;
  };

  document.getElementsByClassName('refresh')[0].addEventListener('click', refresh);
})();
