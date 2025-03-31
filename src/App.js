import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [floatingPoints, setFloatingPoints] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetch('/image-manifest.json')
      .then(res => res.json())
      .then(data => {
        setImages(data);
      });
  }, []);

  const handleAnswer = () => {
    if (animating) return; // Prevent multiple clicks during animation

    // Randomly decide if the answer is correct
    const isCorrect = Math.random() >= 0.5;
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = 20; // Earn 20 points when correct
      setFeedback("Awesome! You earned 20 points!");
      setFloatingPoints("+20");
    } else {
      setFeedback("Oops! No points this time!");
      setFloatingPoints(null);
    }
    
    setAnimating(true);

    // Animation and feedback duration: 1.5 seconds before moving to next image
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + pointsEarned);
      }
      setFeedback('');
      setFloatingPoints(null);
      setAnimating(false);
      setCurrentIndex((currentIndex + 1) % images.length);
    }, 1500);
  };

  if (images.length === 0) return <div>Loading images...</div>;

  return (
    <div className="container">
      <header>
        <h1>Photo Game</h1>
        <div className="score">
          Score: {score}
        </div>
      </header>
      <main className="image-container">
        <img
          src={`/images/${images[currentIndex]}`}
          alt="game"
        />
        {feedback && <div className="feedback">{feedback}</div>}
        {floatingPoints && <div className="floating-points">{floatingPoints}</div>}
        <div className="buttons">
          <button onClick={handleAnswer} disabled={animating}>Mistake</button>
          <button onClick={handleAnswer} disabled={animating}>Not a Mistake</button>
        </div>
      </main>
    </div>
  );
}

export default App;
