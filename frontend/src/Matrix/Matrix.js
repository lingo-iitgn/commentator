import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Libs
import styled from 'styled-components';
import axios from 'axios';

// Components
import Navbar from '../Components/Navbar';
import LanguageBtn from '../Components/LanguageBtn';

// Utils
import LanguageDetect from '../utils/LanguageDetect';
import EnglishSplitter from '../utils/EnglishSplitter';
import HindiSplitter from '../utils/HindiSplitter';
import FetchSentence from '../utils/FetchSentence';

import { StyledButton } from '../utils/styles';
import MatrixRules from './MatrixRules';

const Matrix = props => {
    const history = useNavigate();
    const [sentence, setSentence] = useState('Loading Sentence...');
    const [mat_id, setMat_id] = useState('');
    const [hypertext, setHypertext] = useState([]);
    const [hashtags, setHashtags] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let mat_idFromSession = JSON.parse(sessionStorage.getItem('mat_id'));
                console.log("fetch sentence called: ", mat_idFromSession);
                
                if (mat_idFromSession === 0) {
                    mat_idFromSession += 1;
                }
                sessionStorage.setItem('mat_id', JSON.stringify(mat_idFromSession));
                
                const data = { mat_id: mat_idFromSession};

                const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-m-sentence`, data, {
                    method: "POST",
                    headers: {
                        'Content-type': 'application-json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    body: JSON.stringify(data)
                });

                console.log("server return:", res.data.result);

                const dict = res.data.result;
                setSentence(dict['sentence']);
                setMat_id(dict['mat_id']);

            } catch (error) {
                console.error('Error fetching sentence:', error);
            }
        };
        fetchData();
    }, []);

    const [ selected, setSelected ] = useState('');
    const startTime = new Date();

    const {en, hi} = LanguageDetect(sentence.length > 0 ? sentence : "");
    // console.log('en: ', en, 'hi: ', hi);
    const wordArr = (sent) => {
        if(en > hi){
            return (EnglishSplitter(sent));
        } else {
            return (HindiSplitter(sent));
        }
    };
    const [words, setWords] = useState(sentence.length > 0 ? wordArr(sentence) : wordArr(""));
    useEffect(() => {
        if (sentence.length > 0) {
            let { sent, links, hashs } = wordArr(sentence);
  
            setWords(sent);
            setHypertext(links);
            setHashtags(hashs);
        }
    }, [sentence]);



    const onSubmitHandler = async () => {
        const username = JSON.parse(sessionStorage.getItem('annote_username'));
        const date = new Date();
        const endTime = new Date();

        const timeDifference = (endTime.getTime() - startTime.getTime()) / 1000;
        console.log(timeDifference);

        const data = {
            selected,
            mat_id,
            username,
            date,
            timeDifference,
        };
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit-matrix-sentence`, {
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        });
        // console.log(res);
        sessionStorage.setItem('mat_id', mat_id+1)
        window.location.reload()
    };

    return (
        <StyledContainer>
            <Navbar />
            <StyledGridder>
                <MatrixRules />
                <StyledRightContainer>
                    <StyledSentenceId>#{mat_id}</StyledSentenceId>
                    <StyledSentenceContainer>
                        <StyledDisplaySentenceContainer>
                            <StyledSentence>{sentence}</StyledSentence>
                        </StyledDisplaySentenceContainer>
                        <div>
                            <LanguageBtn selected={selected} setSelected={setSelected} />
                        </div>
                    </StyledSentenceContainer>

                    <StyledSubmitContainer>
                        <StyledButton style={{ width: '100%' }} variant="contained" onClick={onSubmitHandler}>Submit</StyledButton>
                    </StyledSubmitContainer>
                </StyledRightContainer>
            </StyledGridder>
        </StyledContainer>
    );
};

export default Matrix;

const StyledContainer = styled.div`
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const StyledGridder = styled.div`
    display: grid;
    grid-template-columns: 1fr 4fr;
    gap: 20px;
    overflow-y: auto;
    /* margin: */
`;

const StyledRightContainer = styled.div`
    border-left: 3px solid #efefef;
    margin-left: 12px;;
`;

const StyledDisplaySentenceContainer = styled.div`
    margin: 2px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const StyledSentence = styled.p`
    font-size: 32px;
    margin: 12px;
    text-align: left;
    background-color: #efefef;
    padding: 18px;
    border-radius: 12px;
`;

const StyledFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 6px;
    width: 75%;
    margin: 24px auto;
    flex-wrap: wrap;
`;

const StyledWord = styled.div`
    border-radius: 8px;
    padding: 8px 8px;
    text-align: center;

    background-color: ${props => ((props.individualTag) === 'e') ? '#bbdfc8' : '#f3f2c9'};
    background-color: ${props => ((props.individualTag) === 'u') && '#D4DCE9'};
    cursor: pointer;
    display:flex;
    flex: 0 1 10%;
    justify-content: center;
`;

const StyledWordBreakup = styled.div`
    font-size: 20px;
    text-align: center;
    margin: 28px auto 12px auto;
`;

const StyledSentenceContainer = styled.div`
    border: 2px solid #efefef;
    padding: 24px;
    border-radius: 12px;
    width: max-content;
    text-align: center;
    margin: 24px auto;
    width: 90%;
`;

const StyledSubmitContainer = styled.div`
    width: 20%;
    text-align: center;
    margin: 40px auto;
`;

const StyledSentenceId = styled.div`
    background-color: #efefef;
    border-radius: 12px;
    padding: 12px;
    position: fixed;
    top: 75px;
    right: 20px;
`;