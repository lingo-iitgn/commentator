import React from 'react';
import Navbar from '../Components/Navbar';
import Steps from '../Components/Steps';
import styled from 'styled-components';
import { StyledButton } from '../utils/styles';
import { useNavigate } from 'react-router-dom';



const Intermediate = () => {
    const history = useNavigate();
    const onSubmitHandler = () => {
        history('/');
    };
    return (
        <StyledContainer>
          <Navbar />
            <Steps />
             <Row>
                 <StyledButton style={{ margin: 'auto 20px' }} variant="contained" onClick={onSubmitHandler}>Continue</StyledButton>
             </Row>
        </StyledContainer>
    );
};

export default Intermediate;

const StyledContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 50%;
    margin: auto;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-left: -630px;  
`;