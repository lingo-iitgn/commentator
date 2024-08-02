import React, { useState } from "react";

// Libs
import styled from 'styled-components';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Styles
import {
    StyledBox,
    StyledTextField,
    StyledButton,
} from '../utils/styles';


const Signup = props => {
    const history = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showErr, setShowErr] = useState(false);



    const passwordMatcher = () => {
        console.log(password === confirmPassword);
        if(password === confirmPassword){
            setShowErr(false);
        } else {
            setShowErr(true);
        }
    };

    const onSubmitHandler = async () => {
        passwordMatcher();
        const data = {
            username,
            password,
        };
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/signup`, {
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        });
        // const resFinal = await res;
        console.log((res.data));
        history('/');
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

    return (
        <div>
            <StyledTitle>Commentator: A Code-mixed Multilingual Text Annotation Framework</StyledTitle>
            <StyledBox
            component="form"
            sx={{
                '& > :not(style)': { m: 1 },
            }}
            noValidate
            autoComplete="off"
            >
                <StyledHeader>Sign Up</StyledHeader>
                <StyledTextField id="login_username" label="username" variant="outlined" onChange={e => setUsername(e.target.value)}/>
                <StyledTextField id="login_password" label="password" variant="outlined" onChange={e => setPassword(e.target.value)} type='password'/>
                <StyledTextField id="login_confirm_password" label="confirm password" variant="outlined" onChange={e => setConfirmPassword(e.target.value)} type='password'/>
                {showErr && (<Alert severity="error">Password did not match, kindly re-enter.</Alert>)}
                <StyledButton variant="contained" onClick={onSubmitHandler}>Submit</StyledButton>
            </StyledBox>
        </div>
    );
};

export default Signup;

const StyledTitle = styled.div`
  font-size: 30px;
  text-align: center;
  margin: auto;
  width: 100%;
  color: #333;
  margin-bottom: 50px;
`;

const StyledHeader = styled.p`
    font-size: 40px;
    text-align: center;
    margin: auto;
    width: 100%;
    color: #333;
`;