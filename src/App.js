import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [animationClass, setAnimationClass] = useState('');
  const [feedback, setFeedback] = useState('');
  const [scoreAnimation, setScoreAnimation] = useState(false);

  useEffect(() => {
    // Fetch the image manifest generated at build time
    fetch('/image-manifest.json')
      .then(res => res.json())
      .then(data => {
        setImages(data);
      });
  }, []);

  const handleAnswer = () => {
    // Randomly decide if the answer is correct
    const isCorrect = Math.random() >= 0.5;
    if (isCorrect) {
      setScore(score + 1);
      setFeedback("Correct!");
    } else {
      setFeedback("Wrong!");
    }
    setScoreAnimation(true);
    setAnimationClass('fade');
    // After a short delay, clear feedback and move to the next image
    setTimeout(() => {
      setFeedback('');
      setScoreAnimation(false);
      setAnimationClass('');
      setCurrentIndex((currentIndex + 1) % images.length);
    }, 1000);
  };

  if (images.length === 0) return <div>Loading images...</div>;

  return (
    <div className="container">
      <header>
        <h1>Photo Game</h1>
        <div className={`score ${scoreAnimation ? 'score-pop' : ''}`}>Score: {score}</div>
      </header>
      <main className="image-container">
        <img
          src={`/images/${images[currentIndex]}`}
          alt="game"
          className={animationClass}
        />
        {feedback && <div className="feedback">{feedback}</div>}
        <div className="buttons">
          <button onClick={handleAnswer}>Mistake</button>
          <button onClick={handleAnswer}>Not a Mistake</button>
        </div>
      </main>
    </div>
  );
}

export default App;
