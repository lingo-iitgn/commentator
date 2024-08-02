import React from 'react';
import styled from 'styled-components';

const Steps = () => {
    return (
        <StyledContainer>
            <StyledHeader>Steps to Follow!</StyledHeader>
            <StyledSteps>1. Select the <b>individual word tags</b> for the sentence.</StyledSteps>
            <StyledSteps>2. Individual word tags get colored according to the color convention below:</StyledSteps>
            <StyledSteps>3. 'English' - green 🟢</StyledSteps>
            <StyledSteps>4. 'Hindi' - yellow 🟡</StyledSteps>
            <StyledSteps>5. 'Unidentified' - blue 🔵</StyledSteps>
            <StyledSteps>6. If necessary, adjust the tags according to the context of the sentence.</StyledSteps>
            <StyledSteps>7. Click "Submit" to save your changes and proceed to the next sentence.</StyledSteps>
        </StyledContainer>
    );
};

export default Steps;

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