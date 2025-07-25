import React from 'react';
import styled from 'styled-components';

const NERRules = () => {
    return (
        <StyledContainer>
            <StyledHeader>Steps to Follow!</StyledHeader>
            <StyledSteps>1. Automatic NER Tags are assigned to every lexicon.</StyledSteps>
            <StyledSteps>2. Update individual NER tags.</StyledSteps>
            <StyledSteps>3. Click on the dropdown menu, a list of tags will appear.</StyledSteps>
            <StyledSteps>4. Choose the updated NER Tag.</StyledSteps>
            <StyledSteps>5. Submit to load the next sentence.</StyledSteps>
        </StyledContainer>
    );
};

export default NERRules;

const StyledContainer = styled.div`
    width: 25%;
    height: 100vh;
    position: fixed;
    top: 50px;
    padding-right: 12px;
    margin: 20px;
    border-right: 3px solid #efefef;
    padding-top: 50px;
`;

const StyledHeader = styled.div`
    font-size: 28px;
`;

const StyledSteps = styled.div`
    font-size: 18px;
    margin: 8px auto;
`;