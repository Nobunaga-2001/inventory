import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png'; // Import your logo image

const LandingPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f8ff', // Light background color
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  };

  const logoStyle = {
    width: '150px',
    marginBottom: '20px',
    animation: 'spin 3s infinite linear',
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#333',
  };

  const buttonStyle = {
    
    padding: '15px 30px',
    fontSize: '1.2rem',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '10px',
    transition: 'background-color 0.3s ease',
  };
/*
  .div1 { grid-area: 4 / 2 / 10 / 5; }
  .div2 { grid-area: 4 / 6 / 5 / 8; }
  .div3 { grid-area: 6 / 6 / 7 / 8; }
  .div4 { grid-area: 9 / 6 / 10 / 8; }
  .div5 { grid-area: 4 / 6 / 10 / 8; }*/
  const buttonStyle2 = {
    display :  9 / 6 / 10 / 8,
    padding: '15px 30px',
    fontSize: '1.2rem',
    color: '#fff',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '10px',
    transition: 'background-color 0.3s ease',
  };

  const buttonStyle3 = {
    display: 4 / 6 / 5 / 8,
    padding: '15px 30px',
    fontSize: '1.2rem',
    color: '#fff',
    backgroundColor: '#023d1b ',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '10px',
    transition: 'background-color 0.3s ease',
  };

  const buttonHoverStyle = {
    backgroundColor: '#0056b3',
  };

  const handleMouseEnter = (e) => {
    e.target.style.backgroundColor = buttonHoverStyle.backgroundColor;
  };

  const handleMouseLeave = (e) => {
    e.target.style.backgroundColor = buttonStyle.backgroundColor;
  };

  return (
    <div style={containerStyle}>
      <header>
        <img src={logo} alt="Logo" style={logoStyle} />
        <h1 style={titleStyle}>Select your Role</h1>
      </header>

      <div>
        <button
          style={buttonStyle2}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/pager')}
        >
          User Registration
        </button>
        <button
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/login')}
        >
          Login
        </button>
        <button
          style={buttonStyle3}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/adminreg')}
        >
          Admin Registration
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
