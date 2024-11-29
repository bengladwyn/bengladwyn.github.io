// Particle dataset
const particles = [
  { name: "Electron", mass: 9.109e-31, charge: -1, spin: 0.5, discoveryDate: 1897, lifetime: Infinity },
  { name: "Proton", mass: 1.673e-27, charge: 1, spin: 0.5, discoveryDate: 1919, lifetime: Infinity },
  { name: "Neutron", mass: 1.675e-27, charge: 0, spin: 0.5, discoveryDate: 1932, lifetime: 881.5 },
  { name: "Photon", mass: 0, charge: 0, spin: 1, discoveryDate: 1900, lifetime: Infinity },
  { name: "Muon", mass: 1.884e-28, charge: -1, spin: 0.5, discoveryDate: 1936, lifetime: 2.2e-6 },
  { name: "Tau", mass: 3.167e-27, charge: -1, spin: 0.5, discoveryDate: 1975, lifetime: 2.9e-13 },
  { name: "Higgs Boson", mass: 1.26e-25, charge: 0, spin: 0, discoveryDate: 2012, lifetime: 1.56e-22 },
  { name: "Neutrino", mass: 0, charge: 0, spin: 1/2, discoveryDate: 1956, lifetime: Infinity }
];

// Shuffle the particle array and split into two decks
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

shuffleDeck(particles);

const playerDeck = particles.slice(0, particles.length / 2);
const opponentDeck = particles.slice(particles.length / 2);

// Update card count display
function updateCardCounts() {
  document.getElementById("player-count").textContent = `Your Cards: ${playerDeck.length}`;
  document.getElementById("opponent-count").textContent = `Opponent's Cards: ${opponentDeck.length}`;
}

// Display card details in the HTML
function displayCard(side, card) {
  document.getElementById(`${side}-name`).textContent = card.name;
  document.getElementById(`${side}-mass`).textContent = card.mass;
  document.getElementById(`${side}-charge`).textContent = card.charge;
  document.getElementById(`${side}-spin`).textContent = card.spin;
  document.getElementById(`${side}-discoveryDate`).textContent = card.discoveryDate;
  document.getElementById(`${side}-lifetime`).textContent = card.lifetime === Infinity ? "Infinity" : card.lifetime;
}

// Display the player's top card
function displayPlayerCard() {
  const playerCard = playerDeck[0];
  displayCard("player", playerCard);
}

// Display a blank card for the opponent
function displayOpponentCardBlank() {
  document.getElementById("opponent-name").textContent = "Hidden";
  document.getElementById("opponent-mass").textContent = "?";
  document.getElementById("opponent-charge").textContent = "?";
  document.getElementById("opponent-spin").textContent = "?";
  document.getElementById("opponent-discoveryDate").textContent = "?";
  document.getElementById("opponent-lifetime").textContent = "?";
}

// Reveal the opponent's top card
function displayOpponentCard() {
  const opponentCard = opponentDeck[0];
  displayCard("opponent", opponentCard);
}

// Compare cards based on the selected property
function compareCards() {
  const selectedProperty = document.getElementById("property-select").value;
  const playerCard = playerDeck[0];
  const opponentCard = opponentDeck[0];
  const resultDiv = document.getElementById("result");

  displayOpponentCard();

  if (playerCard[selectedProperty] > opponentCard[selectedProperty]) {
    resultDiv.textContent = `You win! Your ${selectedProperty} (${playerCard[selectedProperty]}) beats ${opponentCard.name}'s (${opponentCard[selectedProperty]}).`;
    playerDeck.push(opponentDeck.shift());
    playerDeck.push(playerDeck.shift());
  } else if (playerCard[selectedProperty] < opponentCard[selectedProperty]) {
    resultDiv.textContent = `You lose! ${opponentCard.name}'s ${selectedProperty} (${opponentCard[selectedProperty]}) beats your ${selectedProperty} (${playerCard[selectedProperty]}).`;
    opponentDeck.push(playerDeck.shift());
    opponentDeck.push(opponentDeck.shift());
  } else {
    resultDiv.textContent = `It's a tie! Both have the same ${selectedProperty} (${playerCard[selectedProperty]}).`;
    playerDeck.push(playerDeck.shift());
    opponentDeck.push(opponentDeck.shift());
  }

  updateCardCounts();
  checkGameOver();

  // Change the button text to 'Next Cards'
  document.getElementById("compare-button").textContent = "Next Cards";
  isNextCards = true;
}

// Go to the next cards and reset the opponent's card
function nextCards() {
  // Move to the next cards and reset the opponent's display
  displayPlayerCard();
  displayOpponentCardBlank();
  document.getElementById("result").textContent = "";
  
  // Change the button back to 'Compare'
  document.getElementById("compare-button").textContent = "Compare";
  isNextCards = false;
}

// Check if the game is over
function checkGameOver() {
  if (playerDeck.length === 0) {
    alert("Game Over! The opponent wins.");
    resetGame();
  } else if (opponentDeck.length === 0) {
    alert("Congratulations! You win.");
    resetGame();
  }
}

// Reset the game
function resetGame() {
  shuffleDeck(particles);
  playerDeck.splice(0, playerDeck.length, ...particles.slice(0, particles.length / 2));
  opponentDeck.splice(0, opponentDeck.length, ...particles.slice(particles.length / 2));
  updateCardCounts();
  displayPlayerCard();
  displayOpponentCardBlank();
  document.getElementById("result").textContent = "";
}

// Initialize the game
updateCardCounts();
displayPlayerCard();
displayOpponentCardBlank();

// Add event listener to the compare button
let isNextCards = false; // Tracks whether we are in 'Next Cards' state

document.getElementById("compare-button").addEventListener("click", () => {
  if (isNextCards) {
    nextCards();
  } else {
    compareCards();
  }
});
