import React, { useState, useEffect } from "react";

// Libs
import styled from "styled-components";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Styles
import { StyledBox, StyledTextField, StyledButton } from "../utils/styles";

const Login = (props) => {
  const history = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const onSubmitHandler = async () => {
    const data = {
      username,
      password,

    };
    const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/login`, {
      method: "POST",
      headers: {
        "Content-type": "application-json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    });
    // const resFinal = await res;
    // console.log(res.data.success.admin)
    res.data.success && sessionStorage.setItem("annote_user", true);
    res.data.success &&
      sessionStorage.setItem(
        "annote_username",
        JSON.stringify(res.data.success.username)
      );
    res.data.success &&
      sessionStorage.setItem(
        "annote_user_id",
        JSON.stringify(res.data.success.username)
      );
    res.data.success &&
      sessionStorage.setItem(
        "sentId",
        JSON.stringify(res.data.success.sentId)
      );
    res.data.success &&
      sessionStorage.setItem(
        "mat_id",
        JSON.stringify(res.data.success.mat_id)
      );
    res.data.success &&
      sessionStorage.setItem(
        "pos_id",
        JSON.stringify(res.data.success.pos_id)
      );
    res.data.success &&
    sessionStorage.setItem(
      "annote_admin",
      JSON.stringify(res.data.success.admin)
    );

    console.log(res.data);
    if(res.data.success.admin){
      (res.data.success) && history('/admin')
    } else {
      (res.data.success) && history('/tasks');
    }

  };

  return (
    <div>
      <StyledTitle>Commentator: A Code-mixed Multilingual Text Annotation Framework</StyledTitle>
      <StyledBox
        component="form"
        sx={{
          "& > :not(style)": { m: 1 },
        }}
        noValidate
        autoComplete="off"
      >
        <StyledHeader>Login</StyledHeader>
        <StyledTextField
          id="login_username"
          label="username"
          variant="outlined"
          onChange={(e) => setUsername(e.target.value)}
        />
        <StyledTextField
          id="login_password"
          label="password"
          variant="outlined"
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />
        <StyledButton variant="contained" onClick={onSubmitHandler}>
          Submit
        </StyledButton>

        <StyledSignup onClick={() => history('/signup')}>Don't have an account? <StyledBlue>Sign Up</StyledBlue></StyledSignup>
      </StyledBox>
    </div>
  );
};

export default Login;

const StyledHeader = styled.p`
  font-size: 40px;
  text-align: center;
  margin: auto;
  width: 100%;
  color: #333;
`;

const StyledTitle = styled.div`
  font-size: 30px;
  text-align: center;
  margin: auto;
  width: 100%;
  color: #333;
  margin-bottom: 50px;
`;

const StyledSignup = styled.div`
  margin: auto;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
`;

const StyledBlue = styled.div`
  color: #0000D1;
  margin-left: 4px;
  text-decoration: underline;
`;