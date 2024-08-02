import React, { useState } from 'react';

import styled from 'styled-components';

const LanguageBtn = ({ selected, setSelected }) => {
    return (
        <StyledFlexer>
            <StyledEnBtn lang={selected} onClick={() => setSelected('e')}>English</StyledEnBtn>
            <StyledHiBtn lang={selected} onClick={() => setSelected('h')}>Hindi</StyledHiBtn>
        </StyledFlexer>
    );
};

export default LanguageBtn;

const StyledFlexer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 12px;
`;

const StyledEnBtn = styled.div`
    border-radius: 8px;
    padding: 8px 4px;
    width: 100px;
    text-align: center;

    background-color: ${props => props.lang === 'e' ? '#502380' : '#efefef'};
    color: ${props => props.lang === 'e' ? '#efefef' : '#333'};
    cursor: pointer;
`;

const StyledHiBtn = styled.div`
    border-radius: 8px;
    padding: 8px 4px;
    width: 100px;
    text-align: center;

    background-color: ${props => props.lang === 'h' ? '#502380' : '#efefef'};
    color: ${props => props.lang === 'h' ? '#efefef' : '#333'};
    cursor: pointer;
`;