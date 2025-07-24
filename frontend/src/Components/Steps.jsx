import React from 'react';
import styled from 'styled-components';

const Steps = () => {
    return (
        <StyledContainer>
            <StyledHeader>Steps to Follow!</StyledHeader>
            <StyledSteps>1. Select the <b>Language</b> for the sentence.</StyledSteps>
            <StyledSteps>2. The selected language turns purple.</StyledSteps>
            <StyledSteps>3. Individual word tags get a default color.</StyledSteps>
            <StyledSteps>4. You need to tag the words following below color convention</StyledSteps>
            <StyledSteps>5. 'English' - green 🟢</StyledSteps>
            <StyledSteps>6. 'Hindi' - yellow 🟡</StyledSteps>
            <StyledSteps>7. 'Unidentified' - blue 🔵</StyledSteps>
            <StyledSteps>8. Submit</StyledSteps>
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