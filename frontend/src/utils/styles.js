import styled from 'styled-components';

// Libs
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export const StyledBox = styled(Box)`
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    margin: auto;
    width: 50% !important;
    vertical-align: middle !important;
    border: 2px solid #efefef;
    padding: 16px;
    border-radius: 8px;;
`;

export const StyledTextField = styled(TextField)`
    /* width: 100% !important; */
`;

export const StyledButton = styled(Button)`
    background-color: #502380 !important;
    /* width: 100% !important; */
`;