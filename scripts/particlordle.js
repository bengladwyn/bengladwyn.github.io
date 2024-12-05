// Import Firebase dependencies
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAgihQUopll7s3NxvR76fRdxv_J3FTTWXo",
    authDomain: "particlordle.firebaseapp.com",
    projectId: "particlordle",
    storageBucket: "particlordle.firebasestorage.app",
    messagingSenderId: "277726826133",
    appId: "1:277726826133:web:1ff443c51fda0cb909159c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Game variables
let validWords = [];
let secretWord = "";
const maxAttempts = 6;
let attempts = 0;

// DOM elements
const gameGrid = document.getElementById('game');
const message = document.getElementById('message');
const wordInfo = document.getElementById('wordInfo');
const guessInput = document.getElementById('guess');
const submitGuessButton = document.getElementById('submitGuess');
const submitScoreButton = document.getElementById('submitScore');

// Initialize the grid
for (let i = 0; i < maxAttempts * 5; i++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    gameGrid.appendChild(tile);
}

// Load words and set today's word
fetch('words.csv')
    .then(response => response.text())
    .then(data => {
        const today = new Date().toISOString().split('T')[0];
        const rows = data.trim().split('\n');
        const wordMap = rows.reduce((map, row) => {
            const [date, word, description, image] = row.split(',');
            const upperWord = word.trim().toUpperCase();
            map[date] = { word: upperWord, description: description.trim(), image: image.trim() };

            if (!validWords.includes(upperWord)) {
                validWords.push(upperWord);
            }
            return map;
        }, {});

        if (wordMap[today]) {
            secretWord = wordMap[today].word;
            window.wordDetails = wordMap[today]; // Store today's word details
        } else {
            message.textContent = "No word found for today.";
        }
    })
    .catch(error => {
        console.error("Error loading words:", error);
        message.textContent = "Error loading the word of the day.";
    });

// Submit leaderboard score to Firestore
async function submitLeaderboard(name, attempts) {
    if (!name) {
        console.error("Name is required for submitting the leaderboard.");
        return;
    }

    try {
        const docRef = await addDoc(collection(db, "leaderboard"), {
            name: name,
            attempts: attempts,
            date: new Date().toISOString().split('T')[0]  // Store the date
        });
        refreshLeaderboard();
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Load the valid words list
fetch('valid_words.txt')
.then(response => response.text())
.then(data => {
    // Split the file into lines, trim whitespace, and convert to uppercase
    const loadedWords = data.trim().split('\n').map(word => word.trim().toUpperCase());

    // Add the valid words to the validWords array, avoiding duplicates
    loadedWords.forEach(word => {
        if (!validWords.includes(word)) {
            validWords.push(word);
        }
    });
})
.catch(error => {
    console.error("Error loading valid words:", error);
    message.textContent = "Error loading the valid words list.";
});


async function fetchLeaderboard() {
    const leaderboardRef = collection(db, "leaderboard");
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Query Firestore for entries with today's date
    const q = query(
        leaderboardRef,
        orderBy("attempts"), // Order by attempts (lowest to highest)
        limit(15),          // Limit to top 15
        where("date", "==", today) // Only entries for today's date
    );

    const querySnapshot = await getDocs(q);
    const leaderboard = [];
    querySnapshot.forEach((doc) => {
        leaderboard.push(doc.data());
    });
    return leaderboard;
}

async function refreshLeaderboard() {
    const leaderboard = await fetchLeaderboard();
    const leaderboardContainer = document.getElementById('leaderboard');
    leaderboardContainer.innerHTML = '<h2>Leaderboard</h2>';
    leaderboard.forEach(entry => {
        leaderboardContainer.innerHTML += `<p>${entry.name}: ${entry.attempts} attempts</p>`;
    });
}

// Game logic
function makeGuess() {
    if (!secretWord) {
        message.textContent = "Word of the day is not loaded yet.";
        return;
    }

    if (!validWords.length) {
        message.textContent = "Valid words are not loaded yet.";
        return;
    }

    const guessInput = document.getElementById('guess');
    const guess = guessInput.value.toUpperCase();

    if (guess.length !== 5) {
        message.textContent = "Please enter a 5-letter word.";
        return;
    }

    if (!validWords.includes(guess)) {
        message.textContent = `"${guess}" is not a valid word. Try again.`;
        return;
    }

    const tiles = gameGrid.querySelectorAll('.tile');
    const start = attempts * 5;

    // Track letter counts for the secret word
    const secretLetterCounts = {};
    for (const letter of secretWord) {
        secretLetterCounts[letter] = (secretLetterCounts[letter] || 0) + 1;
    }

    // First pass: Check for correct positions (green)
    const result = Array(5).fill(null); // Placeholder for tile states
    for (let i = 0; i < 5; i++) {
        tiles[start + i].textContent = guess[i];
        if (guess[i] === secretWord[i]) {
            tiles[start + i].classList.add('correct');
            result[i] = 'correct';
            secretLetterCounts[guess[i]]--; // Reduce count for matched letter
        }
    }

    // Second pass: Check for present letters (yellow)
    for (let i = 0; i < 5; i++) {
        if (result[i] === null) { // Not already marked as correct
            if (secretLetterCounts[guess[i]] > 0) {
                tiles[start + i].classList.add('present');
                result[i] = 'present';
                secretLetterCounts[guess[i]]--; // Reduce count for matched letter
            } else {
                tiles[start + i].classList.add('absent');
                result[i] = 'absent';
            }
        }
    }

    attempts++;
    guessInput.value = '';

    if (guess === secretWord) {
        message.textContent = "Congratulations! You guessed the word! Scroll down to learn more and submit your score to the leaderboard.";
        wordInfo.innerHTML = `
            <p><strong>Facts of the day:</strong> ${window.wordDetails.description}</p>
            <img src="${window.wordDetails.image}" alt="${guess}" width="300">
        `;
        guessInput.disabled = true;

        // Show the form to submit the score
        document.getElementById('submitForm').style.display = 'block';
        return;
    }

    if (attempts === maxAttempts) {
        message.textContent = `Game over! The word was ${secretWord}.`;
        guessInput.disabled = true;
    }
    
}


function submitScore() {
    const name = document.getElementById('playerName').value;
    if (!name) {
        alert("Please enter your name!");
        return;
    }

    submitLeaderboard(name, attempts);
    
    // Hide the submit form after submitting
    document.getElementById('submitForm').style.display = 'none';
}

// Event listeners
submitGuessButton.addEventListener('click', makeGuess);

// Event listeners
submitScoreButton.addEventListener('click', submitScore);

// Load leaderboard on page load
window.onload = function() {
    refreshLeaderboard();
};
