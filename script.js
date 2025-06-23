// Global variables
let currfolder;
let currentsong = new Audio();
let songs = []; // Global so all functions access updated song list

// Function to fetch songs from the specified folder
async function getsongs(folder) {
  currfolder = folder;
  let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
  let response = await a.text();

  // Create a temporary DOM element to parse the song list
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  let songsArr = [];

  // Extract only .mp3 files from the links
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songsArr.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  // Display all songs in the UI
  let songul = document.querySelector(".songlist ul");
  songul.innerHTML = ""; // Clear existing songs
  for (const song of songsArr) {
    songul.innerHTML += `
      <li>
        <img class="invert" src="/src/images/music.svg" alt="">
        <div class="info">
          <div>${song.replaceAll("%20", " ")}</div>
          <div>Adeel</div>
        </div>
        <div class="playnow">
          <img class="invert" src="/src/images/play.svg" alt="">
          <span>Play Now</span>
        </div>
      </li>`;
  }

  // Attach click event to each song item
  Array.from(document.querySelectorAll(".songlist li")).forEach((e) => {
    e.addEventListener("click", (event) => {
      const songName = e.querySelector(".info").firstElementChild.innerHTML.trim();
      playmusic(songName, false, event);
    });
  });

  return songsArr;
}

// Function to play the selected music track
const playmusic = (track, pause = false, event = null) => {
  currentsong.src = `/${currfolder}/` + track;

  if (!pause) {
    currentsong.play();
    document.getElementById("play").src = "/src/images/pause.svg";

    // Reset all play icons
    document.querySelectorAll(".playnow img").forEach((img) => {
      img.src = "/src/images/play.svg";
    });

    // Update current song icon to pause
    if (event && event.currentTarget) {
      const playIcon = event.currentTarget.querySelector(".playnow img");
      if (playIcon) playIcon.src = "/src/images/pause.svg";
    }
  }

  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Converts seconds to MM:SS format
function secondsToMinutesSeconds(time) {
  let totalSeconds = time > 1000 ? Math.floor(time / 1000) : Math.floor(time);
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Function to display albums
async function displayalbums() {
  let a = await fetch(`http://127.0.0.1:3000/songs/`);
  let response = await a.text();
  let cardcontainer = document.querySelector(".cardcontainer");

  // Create a temporary DOM element to parse the song list
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchor = div.getElementsByTagName("a");
  cardcontainer.innerHTML = ""; // Clear previous cards

  Array.from(anchor).forEach(async (e) => {
    if (e.href.includes("/songs/") && !e.href.endsWith(".mp3")) {
      let folder = e.href.split("/").filter(Boolean).pop();
      // get the metadata of the folder
      try {
        let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
        let info = await a.json();
        cardcontainer.innerHTML += `<div data-folder="${folder}" class="card">
              <div class="play">
              <svg
                class="play-button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" fill="#1ed760" />
                <path
                  d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z"
                  fill="black"
                />
              </svg>
              </div>

              <img
                src="/songs/${folder}/cover.jpeg"
                alt=""
              />
              <h2>${info.Title}</h2>
              <p>${info.Description}</p>
            </div>`;
      } catch (err) {
        // ignore folders without info.json
      }
    }
  });

  // Attach click handler after cards are rendered
  setTimeout(() => {
    Array.from(document.querySelectorAll(".card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
        if (songs.length > 0) {
          playmusic(songs[0], true); // Load first song, no autoplay
        }
      });
    });
  }, 500); // Wait for cards to be rendered
}

// Main logic
async function main() {
  // Load initial folder
  songs = await getsongs("songs/Guzarishayn");
  playmusic(songs[0], true); // Don't autoplay

  // Display all the albums on the page
  displayalbums();

  // Next button
  document.getElementById("next").addEventListener("click", () => {
    let currentSrc = currentsong.src.split(`${currfolder}/`)[1] || "";
    let currentFile = decodeURIComponent(currentSrc.split("?")[0]);
    let currentIndex = songs.indexOf(currentFile);
    if (currentIndex < songs.length - 1 && currentIndex !== -1) {
      playmusic(songs[currentIndex + 1]);
    }
  });

  // Previous button
  document.getElementById("previous").addEventListener("click", () => {
    let currentSrc = currentsong.src.split(`${currfolder}/`)[1] || "";
    let currentFile = decodeURIComponent(currentSrc.split("?")[0]);
    let currentIndex = songs.indexOf(currentFile);
    if (currentIndex > 0) {
      playmusic(songs[currentIndex - 1]);
    }
  });

  // Toggle play/pause
  document.getElementById("play").addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      document.getElementById("play").src = "/src/images/pause.svg";
    } else {
      currentsong.pause();
      document.getElementById("play").src = "/src/images/play.svg";
    }
  });

  // Update progress bar and time
  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentsong.currentTime
    )} / ${secondsToMinutesSeconds(currentsong.duration)}`;

    if (!isNaN(currentsong.duration)) {
      document.querySelector(".circle").style.left = `${(currentsong.currentTime / currentsong.duration) * 100}%`;
    }
  });

  // Seek bar click
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    const seekbarWidth = e.target.getBoundingClientRect().width;
    const percent = (e.offsetX / seekbarWidth) * 100;
    document.querySelector(".circle").style.left = `${percent}%`;

    if (!isNaN(currentsong.duration)) {
      currentsong.currentTime = (percent / 100) * currentsong.duration;
    }
  });

  // Sidebar hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // Sidebar close
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  // Volume range input
  document.querySelector(".range input").addEventListener("change", (e) => {
    currentsong.volume = parseInt(e.target.value) / 100;
  });

  // Mute toggle
  document.querySelector(".volume-icon").addEventListener("click", () => {
    currentsong.muted = !currentsong.muted;
    document.querySelector(".volume-icon").src = currentsong.muted
      ? "/src/images/mute.svg"
      : "/src/images/volume.svg";
  });
}

// Start the app
main();
