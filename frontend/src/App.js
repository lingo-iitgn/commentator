import React from 'react';
import Routes from './Router';
import styled from 'styled-components';

function App() {
  return (
    <Container>
      <Routes />
    </Container>
  );
}

export default App;

const Container = styled.div`
  min-width: 100vw;
  width: 100%;
  min-height: 100vh;
  height: 100%;
  background-color: #fefefe;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
`;