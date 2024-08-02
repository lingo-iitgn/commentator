import React from 'react';
import styled from 'styled-components';

const MatrixRules = () => {
    return (
        <StyledContainer>
            <StyledHeader>Steps to Follow!</StyledHeader>
            <StyledSteps>1. Select the <b>Matrix Language</b> for the sentence.</StyledSteps>
            <StyledSteps>2. The selected language turns purple 🟣.</StyledSteps>
            <StyledSteps>3. If necessary, adjust the tags according to the context of the sentence.</StyledSteps>
            <StyledSteps>4. Click <b>Submit</b> to save your changes and proceed to the next sentence.</StyledSteps>
        </StyledContainer>
    );
};

export default MatrixRules;

const StyledContainer = styled.div`
    width: 100%;
    margin: 20px;
`;

const StyledHeader = styled.div`
    font-size: 28px;
`;

const StyledSteps = styled.div`
    font-size: 18px;
    margin: 8px auto;
`;