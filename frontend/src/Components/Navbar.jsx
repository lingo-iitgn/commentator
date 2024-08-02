import React from 'react';

// Libs
import styled from 'styled-components';
import { PowerSettingsNew } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const history = useNavigate();
    const location = useLocation();
    const logged_in_user = JSON.parse(sessionStorage.getItem('annote_username'));
    const logged_in_admin = JSON.parse(sessionStorage.getItem('annote_admin'));
    const logoutHandler = async () => {

        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/logout`, {
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
        });
        // const resFinal = await res;
        console.log(res.data);
        sessionStorage.setItem('annote_user', false)
        sessionStorage.setItem('annote_username', "")
        sessionStorage.setItem('annote_sentId', 0)
        sessionStorage.setItem('annote_admin', false)
        history('/login');
        // fetch('/signup', {
        //     method: 'POST',
        //     headers: {
        //       'Content-type': 'application-json'
        //     },
        //     body: JSON.stringify(data)
        //   })
        //   .then(res => res.json())
        //   .then(res => console.log(res))
        //   .catch(err => console.log(err));
    };

    const createSchemas = process.env.REACT_APP_BACKEND_URL + '/sentence-schema-creation'
    return (
        <StyledNavbarContainer>
        <StyledName onClick={() => history('/')}>COMMENTATOR</StyledName>
        <StyledFlex>
                {logged_in_admin && (<StyledForm method="POST" action={createSchemas} enctype="multipart/form-data" >
                    <StyledButton type="submit">Create Schemas</StyledButton>
                </StyledForm>)}
            {!logged_in_admin && location.pathname === '/' && (
                    <StyledUsername onClick={() => history('/profile')}>
                        Edit Annotations
                    </StyledUsername>
                )}
            {!logged_in_admin && location.pathname === '/pos' && (
                    <StyledUsername onClick={() => history('/profile1')}>
                        Edit Annotations
                    </StyledUsername>
            )}
            <StyledUsername 
                    style={{ 
                        borderColor: 'transparent',
                        textTransform: 'uppercase',
                        backgroundColor: '#FDD835',
                        color: '#ffffff',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        boxShadow: '0 0 10px #FDD835'
                    }} 
                    onClick={() => history('/tasks')}
>
            {logged_in_user}
            </StyledUsername>



            <StyledPowerOff onClick={logoutHandler}/>
        </StyledFlex>
    </StyledNavbarContainer>
    );
};

export default Navbar;

const StyledButton = styled.button`
    /* border-radius: 8px;
    padding: 6px 16px;
    /* width: 65px; */
    height: 40px;
    border: none;
    all: unset;
    background-color: transparent;
    color: #efefef;
    border-bottom: 1px solid #efefef;
    padding-bottom: 6px;
    cursor: pointer;
`;


const StyledNavbarContainer = styled.div`
    position: fixed;
    top: 0;
    background-color: rgba(80, 35, 128, 0.9);
    width: 100%;
    height: 60px;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    z-index: 0;
`;

const StyledName = styled.p`
    color: #fefefe;
    font-size: 26px;
    margin-left: 16px;
    cursor: pointer;
`;

const StyledPowerOff = styled(PowerSettingsNew)`
    margin-right: 16px;
    color: #fefefe;
    cursor: pointer;
`;

const StyledFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 24px;
`;

const StyledUsername = styled.div`
    color: #efefef;
    border-bottom: 1px solid #efefef;
    padding-bottom: 6px;
`;

const StyledForm = styled.form`
    cursor: pointer;
`;