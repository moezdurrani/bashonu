//opens the settings Menu
document.addEventListener("DOMContentLoaded", function() {
  var dropdownTrigger = document.getElementById("dropdown-trigger");
  var dropdownContent = document.querySelector(".dropdown-content");
  dropdownTrigger.addEventListener("click", function() {
    dropdownContent.classList.toggle("active");
  });

});

//Removes the file extension
function removeIndexFromURL() {
  var currentURL = window.location.href;
  var newURL = currentURL.replace("/index.html", "");
  history.pushState({}, document.title, newURL);
}


//blurs and disables the background
document.addEventListener("DOMContentLoaded", function() {
  var lyricsTrigger = document.getElementById("lyrics");
  var lyricsContainer = document.querySelector(".songDetails");
  var mainWrapper = document.querySelector('.main');

  lyricsTrigger.addEventListener("click", function() {
    lyricsContainer.classList.remove("inactive");
    lyricsContainer.classList.toggle("active");
    mainWrapper.classList.toggle('blurBackground');
  });
});


//close the lyrics when close button is pressed
document.addEventListener("DOMContentLoaded", function() {
  var closeLyrics = document.getElementById("close-lyrics");
  var lyricsContainer = document.querySelector(".lyricsContainer");
  var mainWrapper = document.querySelector('.main');

  closeLyrics.addEventListener("click", function() {
    lyricsContainer.classList.toggle("inactive");
    lyricsContainer.classList.remove("active");
    mainWrapper.classList.remove('blurBackground');
  });
});


//shows lyrics and songs
document.addEventListener("DOMContentLoaded", function() {
  const songDetails = document.querySelector('.main');

  songDetails.classList.add('songDetails');
songDetails.setAttribute('id', 'songDetails');

  const searchInput = document.getElementById('searchInput');

  allMusic.sort((a, b) => a.name.localeCompare(b.name));

  function displaySongs() {
    songDetails.innerHTML = '';

    const searchTerm = searchInput.value.toLowerCase();

    for (var i = 0; i < allMusic.length; i++) {
      const song = allMusic[i];

      if (song.name.toLowerCase().includes(searchTerm) ||
      song.writer.toLowerCase().includes(searchTerm) ||
      song.singer.toLowerCase().includes(searchTerm)) {
        
        const songItem = document.createElement('div');
        songItem.classList.add('song');
        songItem.style.background = 'linear-gradient(180deg, #22262A 0%, #181A1D 100%)';
        songItem.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        songItem.style.borderRadius = '10px';
        songItem.style.padding = '10px';
        songItem.style.marginBottom = '10px';
        songItem.setAttribute('data-index', i); // Store the index of the song

        const songName = document.createElement('div');
        songName.classList.add('songName');
        const name = document.createElement('p');
        name.classList.add('name');
        name.style.fontWeight = 'bold';
        name.innerText = song.name;
        name.style.fontFamily = 'M PLUS Rounded 1c, optima, sans-serif, Arial';
        name.style.fontSize = '18px';
        songName.appendChild(name);

        const songInfo = document.createElement('div');
        songInfo.classList.add('songInfo');

        const writerText = document.createElement('span');
        writerText.innerText = 'Writer: ';
        writerText.style.fontWeight = 'bold';
        writerText.style.color = '#888';
        writerText.style.fontFamily = 'Arial, sans-serif';
        writerText.style.fontSize = '15px';
        songInfo.appendChild(writerText);

        const writer = document.createElement('p');
        writer.classList.add('writer');
        writer.style.color = '#888';
        writer.innerText = song.writer;
        writerText.style.marginRight = '0.5em';
        writer.style.fontFamily = 'Arial, sans-serif';
        writer.style.fontSize = '16px';
        songInfo.appendChild(writer);

        const separator = document.createElement('p');
        separator.innerText = ' | ';
        separator.style.color = '#888';
        separator.style.fontWeight = 'bold';
        songInfo.appendChild(separator);

        const singerText = document.createElement('span');
        singerText.innerText = 'Singer: ';
        singerText.style.fontWeight = 'bold';
        singerText.style.color = '#888';
        singerText.style.marginRight = '0.5em';
        singerText.style.fontFamily = 'Arial, sans-serif';
        singerText.style.fontSize = '15px';
        songInfo.appendChild(singerText);

        const singer = document.createElement('p');
        singer.classList.add('singer');
        singer.style.color = '#888';
        singer.innerText = song.singer;
        singer.style.fontFamily = 'Arial, sans-serif';
        singer.style.fontSize = '16px';
        songInfo.appendChild(singer);

        songItem.appendChild(songName);
        songItem.appendChild(songInfo);

        // Add click event listener to each song item
        songItem.addEventListener('click', function() {
          const lyricsContainer = document.querySelector('.lyricsContainer');
          const lyrics = document.getElementById('lyrics');
          const index = this.getAttribute('data-index'); // Get the index of the clicked song

          // Fetch and display lyrics for the selected song
          fetch(`lyrics/${allMusic[index].lyricsFile}`)
            .then(response => response.text())
            .then(lyricsText => {
              const lines = lyricsText.split('\n');
              lyrics.innerHTML = '';

              for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line !== '') {
                  const paragraph = document.createElement('p');
                  paragraph.textContent = line;
                  paragraph.style.color = 'white';
                  paragraph.style.lineHeight = '2.5';

                  if (song.lang === 'english') {
                    paragraph.style.fontFamily = "'Comfortaa', cursive, sans-serif";
                    paragraph.style.fontSize = '13px';
                    paragraph.style.lineHeight = '2.3';
                  } else if (song.lang === 'urdu') {
                    paragraph.style.lineHeight = '2.5';
                    paragraph.style.fontFamily = "'Noto Nastaliq Urdu', serif, Arial, sans-serif";
                  }

                  lyrics.appendChild(paragraph);
                } else if (i > 0 && lines[i - 1].trim() !== '') {
                  const blankLine = document.createElement('p');
                  blankLine.style.marginBottom = '2em';
                  lyrics.appendChild(blankLine);
                }
              }

              const nameLyrics = document.querySelector('.nameLyrics');
              nameLyrics.innerText = allMusic[index].name;
              nameLyrics.style.fontFamily = 'Comfortaa, Arial, sans-serif';
              nameLyrics.style.fontSize = '17px';
              nameLyrics.style.color = '#919090';

              // Open the lyrics container
              lyricsContainer.classList.remove('inactive');
              lyricsContainer.classList.add('active');
            })
            .catch(error => {
              console.error('Error fetching the lyrics:', error);
            });
        });

        songDetails.appendChild(songItem);
      }
    }
  }

  searchInput.addEventListener('input', displaySongs);
  displaySongs(); // Initially display all songs
});