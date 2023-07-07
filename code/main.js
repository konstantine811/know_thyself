const audio = new Audio();
let prevIndex = 0;
let lengthMusics = 0;

document.addEventListener("DOMContentLoaded", () => {
  const mainImage = document.querySelectorAll("img")[0];
  const preloaderEl = document.querySelector(".preloader");
  const titleNameEl = document.querySelectorAll("h4")[0];
  const textNameEl = document.querySelectorAll("p")[0];
  const textSecondNameEl = document.querySelectorAll("p")[1];
  const titleSecondNameEl = document.querySelectorAll("h4")[1];
  const textSoundEl = document.querySelectorAll("p")[2];
  const titleSoundEl = document.querySelectorAll("h4")[2];
  const tableEl = document.querySelectorAll("table")[0];
  const tableBodyEl = document.querySelectorAll("table tbody")[0];
  function hideImage(status = true) {
    mainImage.className = status ? "hide" : "";
    setTimeout(() => {
      mainImage.style.display = status ? "none" : "block";
    }, 300);
  }

  function hidePreloader(status = true) {
    if (!status) {
      preloaderEl.classList.remove("hide");
    }
    if (status) {
      preloaderEl.classList.add("hide");
    }
  }

  function getData(form) {
    titleNameEl.textContent = "";
    textNameEl.textContent = "";
    textSecondNameEl.textContent = "";
    titleSecondNameEl.textContent = "";
    textSoundEl.textContent = "";
    titleSoundEl.textContent = "";
    hideImage(false);
    tableEl.className = "hide";
    var formData = Object.fromEntries(new FormData(form));

    if (formData.userName) {
      hidePreloader(false);
      getGPTResponse(`Роскажи мені про ім'я ${formData.userName}`)
        .then((response) => response.json())
        .then((data) => {
          hidePreloader();
          // Handle the response data here
          hideImage();
          textNameEl.textContent = data.choices[0].message.content;
          titleNameEl.textContent = `Ваше ім\'я ${formData.userName}`;
        })
        .catch((error) => {
          // Handle any errors that occur during the request
          console.log(error);
        });
    }

    if (formData.secondName) {
      hidePreloader(false);
      getGPTResponse(`Роскажи мені про прізвище ${formData.secondName}`)
        .then((response) => response.json())
        .then((data) => {
          hidePreloader();
          // Handle the response data here
          hideImage();
          textSecondNameEl.textContent = data.choices[0].message.content;
          titleSecondNameEl.textContent = `Ваше прізвище ${formData.secondName}`;
        })
        .catch((error) => {
          // Handle any errors that occur during the request
          console.log(error);
        });
    }
    if (formData.textContent) {
      hidePreloader(false);
      getGPTResponse(
        `Надай мені пронумеровану музику в ${formData.countAudio} пунктів щоб вона була під такий настрій - ${formData.textContent}`
      )
        .then((response) => response.json())
        .then(async (dataM) => {
          hidePreloader();
          // Handle the response data here
          if (dataM && dataM.choices && dataM.choices.length) {
            const msg = dataM.choices[0].message.content;
            textSoundEl.textContent = msg;
            titleSoundEl.textContent = "Музика під мій настрій:";
            const musics = msg.match(/\d+\.\s(.+)/g)?.map(function (match) {
              return match.replace(/\d+\.\s/, "");
            });
            // console.log(musics);
            const trackMusic = await Promise.all(
              musics.map((item) => {
                return searchTracks(item);
              })
            );
            lengthMusics = trackMusic.length;
            const audioTracks = trackMusic
              .map((i) => {
                return i.tracks.items.find((iT) => iT.preview_url);
              })
              .filter((i) => i);
            const audioElements = audioTracks.map((item) => {
              tableEl.classList.remove("hide");
              const trEl = document.createElement("tr");

              const tdAuthorEl = document.createElement("td");
              tdAuthorEl.textContent = item.artists[0].name;
              trEl.append(tdAuthorEl);

              const tdNameEl = document.createElement("td");
              tdNameEl.textContent = item.name;
              trEl.append(tdNameEl);

              const tdSoundEl = document.createElement("td");
              const audioEl = document.createElement("audio");
              audioEl.controls = true;
              audioEl.src = item.preview_url;
              tdSoundEl.append(audioEl);
              trEl.append(tdSoundEl);

              const tdImageEl = document.createElement("td");
              const imageEl = document.createElement("img");
              const img = item.album.images[2];
              imageEl.src = img.url;
              imageEl.style.width = img.width;
              tdImageEl.append(imageEl);
              trEl.append(tdImageEl);
              tableBodyEl.append(trEl);
              return audioEl;
            });
            // audioElements[0].play();
            hideImage();
            /*  audio.src = audioTracks[0].preview_url;
            audio.play();
            audio.addEventListener("ended", (event) => {
              if (prevIndex >= lengthMusics) {
                prevIndex = 0;
              }
              audio.src = audioTracks[prevIndex + 1].preview_url;
              audio.play();
              prevIndex = prevIndex + 1;
            }); */
          }
        })
        .catch((error) => {
          // Handle any errors that occur during the request
          console.log(error);
        });
    }
  }

  document.getElementById("myForm").addEventListener("submit", function (e) {
    e.preventDefault();
    getData(e.target);
  });
});

function getGPTResponse(msg) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer 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", // Replace with your OpenAI API key
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo", // Specify the model you want to use
      messages: [
        {
          role: "user",
          content: msg,
        },
      ],
    }),
  });
}

// request in spotify

const clientId = "ad0b7fe92d3242b692c2e80ae7727274";
const clientSecret = "0aa894e978af4b49be15e983ac3fdf42";

// Функція для отримання токена доступу
function getAccessToken() {
  var authString = clientId + ":" + clientSecret;
  var base64AuthString = btoa(authString);

  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + base64AuthString,
    },
    body: "grant_type=client_credentials",
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      return data.access_token;
    });
}

// Функція для пошуку треків за назвою
function searchTracks(query) {
  var accessToken;
  var apiUrl = "https://api.spotify.com/v1/search";

  return getAccessToken()
    .then(function (token) {
      accessToken = token;

      return fetch(apiUrl + "?q=" + encodeURIComponent(query) + "&type=track", {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      });
    })
    .then(function (response) {
      return response.json();
    });
}
