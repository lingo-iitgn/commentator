import React from 'react';
import styled from 'styled-components';
import { StyledButton } from '../utils/styles';
import { useNavigate } from 'react-router-dom';

import Navbar from '../Components/Navbar';

const Tasks = () => {
    const history = useNavigate();

    // Function to navigate to a specific route
    const navigateTo = (route) => {
        history(route);
    };

    return (
        <StyledContainer>
          <Navbar />
            <Title>Choose any Task to proceed</Title>
            <Row>
            <TaskContainer color="#FFECB3" onClick={() => navigateTo('/Intermediate')}>
                    <AnimatedText>Token-level language Identification</AnimatedText>
                </TaskContainer>
                <TaskContainer color="#B2EBF2" onClick={() => navigateTo('/pos')}>
                    <AnimatedText>Token-level POS tagging</AnimatedText>
                </TaskContainer>
                <TaskContainer color="#FF9999" onClick={() => navigateTo('/matrix')}>
                    <AnimatedText>Matrix language Identification</AnimatedText>
                </TaskContainer>
            </Row>
            <Row>
                <TaskContainer color="#F9CCCC" onClick={() => navigateTo('/task4')}>
                    <AnimatedText>Token-level entity labelling</AnimatedText>
                </TaskContainer>
                <TaskContainer color="#FFDAB9" onClick={() => navigateTo('/task5')}>
                    <AnimatedText>Spelling correction & normalization</AnimatedText>
                </TaskContainer>
                <TaskContainer color="#CE93D8" onClick={() => navigateTo('/task6')}>
                    <AnimatedText>Translations</AnimatedText>
                </TaskContainer>

            </Row>
        </StyledContainer>
    );
};

export default Tasks;



const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 50%;
    margin: auto;
`;

const Title = styled.div`
    color: darkblue;
    font-weight: bold;
    text-align: center; /* Align text to center */
    margin-top: 60px;
    margin-bottom: 20px; /* Add some bottom margin */
    font-size: 36px; /* Increase font size */
    font-family: 'Arial', sans-serif; /* Change font to Arial */

`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
`;
const AnimatedText = styled.div`
  font-family: 'Roboto', sans-serif;
  font-size: 28px;
  color: #333;
  animation: bounce 1s infinite alternate;
  margin-bottom: 20px;

  @keyframes bounce {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-10px);
    }
  }
`;
const TaskContainer = styled.div`
    background-color: ${(props) => props.color};
    color: #333;
    width: 390px;
    height: 240px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 16px;
    font-size: 24px;
    font-family: 'Arial', sans-serif; 
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin: 10px; /* Add margin between rectangles */
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

    &:hover {
        background-color: #C5E1A5; /* Change color on hover */
    }
`;
