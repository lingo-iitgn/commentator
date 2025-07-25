import React from 'react';
import styled from 'styled-components';

const TranslationRules = () => {
    return (
    <StyledContainer>
        <StyledHeader>Steps to Follow!</StyledHeader>
        <StyledSteps>1. Automatic translations are provided for each category: <b>English</b>, <b>Romanized Hindi</b>, and <b>Devanagari Hindi Translations</b>.</StyledSteps>
        <StyledSteps>2. Carefully review the translations for accuracy and context.</StyledSteps>
        <StyledSteps>3. Update individual predictions where corrections are required.</StyledSteps>
        <StyledSteps>4. Ensure consistency across all three categories.</StyledSteps>
        <StyledSteps>5. Click <b>Submit</b> to save your updates and proceed to the next sentence.</StyledSteps>
    </StyledContainer>
    );
};

export default TranslationRules;

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