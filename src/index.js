let game;
let clueToRender;

const container = document.getElementById("container")

document.addEventListener("DOMContentLoaded", () => {
  const start = document.getElementById("start")
  start.addEventListener("click", startGame, false)
})

function loading() {
  const loading = document.createElement("div");
  loading.className = "spinner";

  const bounce1 = document.createElement("div");
  const bounce2 = document.createElement("div");
  const bounce3 = document.createElement("div");
  const arr = [bounce1, bounce2, bounce3];
  arr.map((bounce, idx) => {
    bounce.className = `bounce${idx + 1}`;
    loading.appendChild(bounce);
  });
  container.appendChild(loading);
}

function startGame() {
  discardState();
  loading();

  const configObject = {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json"
    },
  }

  fetch("https://quiet-temple-92211.herokuapp.com/games", configObject)
  .then(resp => resp.json())
  .then(function(json) {
    game = new Game(json);
    discardState();
    renderBoard(game);
  })
}

function renderBoard(gameObj) {
  container.appendChild(gameObj.renderCurrentScore())
  const categories = gameObj.categories;
  for (let i = 0; i < categories.length; i++) {
    let category = Category.all.find((c) => c.id === parseInt(categories[i].id), 10)
    if (category) {
      persistData(category)
    } else {
      fetch(`https://quiet-temple-92211.herokuapp.com/categories/${categories[i].id}`)
      .then(resp => resp.json())
      .then(function(json) {
        let category = new Category(json);
        persistData(category);
      });
    }
  }
}


function renderClue(clueId) {
  loading();
  if (!Clue.all.find(c => c.id === clueId)) {
    fetch(`https://quiet-temple-92211.herokuapp.com/clues/${clueId}`)
    .then(resp => resp.json())
    .then(function(json) {
      clueToRender = new Clue(json);
      discardState()
      container.appendChild(game.renderCurrentScore());
      container.appendChild(clueToRender.render());
    })
    .catch(error => console.log(error))
  }
}

function updateGame() {

  let answerStatus = document.createElement("div");
  answerStatus.className = "answer-status"
  const updateData = { score: game.score }

  const configObj = {
    method: "PATCH",
    headers: {
      "Content-type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(updateData)
  }
  loading();
  fetch(`https://quiet-temple-92211.herokuapp.com/games/${game.id}`, configObj)
  .then(resp => resp.json())
  .then(function(json) {
    clueToRender.answered = true;
    if (clueToRender.answeredCorrectly === true) {
      answerStatus.innerHTML = "CORRECT!"
    } else if (clueToRender.answeredCorrectly === false) {
      answerStatus.innerHTML = `SORRY, THE CORRECT ANSWER IS: \"${clueToRender.answer}\"`
    }
    container.appendChild(answerStatus)
    const scoreDiv = document.getElementById("score");
    scoreDiv.innerText = "CURRENT SCORE: $" + game.score;
    Clue.all.push(clueToRender);
    discardState();
    if (Clue.answeredClues().length === 30){
      container.appendChild(answerStatus)
      gameOver();
    } else {
      container.appendChild(answerStatus);
      renderBoard(game);
    }
  })
  .catch(error => console.log(error))
}

function discardState() {
  container.innerHTML = '<img id="logo" src="style_assets/Jeopardy!_logo.png">';
}

function persistData(category) {
  const categoryColumn = category.renderCategoryColumn();
  container.appendChild(categoryColumn);
  categoryColumn.appendChild(category.renderCategoryBubble());

  const clues = category.clues
  clues.map(clue => {
    let clueBubble = document.createElement("div");
    clueBubble.id = clue.id;
    clueBubble.className = "clue-bubble";
    if (!Clue.answeredClues().find(c => c.id === clue.id && c.answered === true)) {
      clueBubble.innerHTML = "$" + clue.value;
    } else {
      clueBubble.innerHTML = ""
    }
    categoryColumn.appendChild(clueBubble);
    clueBubble.addEventListener("click", function handler(e) {
      if(!!Clue.answeredClues().find(c => c.id === parseInt((clue.id), 10) && c.answered === true)) {
        clueBubble.removeEventListener("click", handler, false);
      } else {
        discardState();
        renderClue(clueBubble.id);
      }
    })
  })
}

function gameOver() {
  const gameOverDiv = document.createElement("div");
  gameOverDiv.className = "bubble";
  gameOverDiv.id = "game-over";
  container.appendChild(gameOverDiv);

  const p3 = document.createElement("p");
  p3.className = "game-over-text"
  p3.innerHTML = "THE GAME IS OVER! \nYOUR FINAL SCORE IS: \n$" + game.score;
  gameOverDiv.appendChild(p3)

  const p4 = document.createElement("p");
  p4.className = "game-over-text";
  p4.innerHTML = "HERE ARE THE PREVIOUS HIGH SCORES";
  gameOverDiv.appendChild(p4);

  gameOverDiv.appendChild(game.renderHighScores());

}
