import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Libs
import styled from 'styled-components';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// Components
import Navbar from '../Components/Navbar';
import LanguageBtn from '../Components/LanguageBtn';

// Utils
import LanguageDetect from '../utils/LanguageDetect';
import EnglishSplitter from '../utils/EnglishSplitter';
import HindiSplitter from '../utils/HindiSplitter';
// import FetchSentence from '../utils/FetchEdit';

import { StyledButton } from '../utils/styles';
import Steps from '../Components/Steps';


const FetchSentence = async (id_prop) => {
    const id = JSON.parse(id_prop); // Assuming id_prop is already a JSON-parsed value
    const data = {
        sentId: id, 
    };
    console.log("fetch sent called id: ", id);
    try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-sentence`, data);
        console.log("server return:", res.data.result);
        return res.data.result;
    } catch (error) {
        console.error('Error fetching sentence:', error);
        throw error; // Rethrow the error to handle it in the caller function
    }
};

const Edit = props => {
    const { sid } = useParams();
    const history = useNavigate();
    const [sentence, setSentence] = useState('');
    const [sentId, setSentId] = useState(sid);
    const [hypertext, setHypertext] = useState([]);
    const [hashtags, setHashtags] = useState([]);
    const [feedback, setFeedback] = useState('');
    const [feedbackVisible, setFeedbackVisible] = useState(false);

    console.log(sentId);
    const logged_in_user = JSON.parse(sessionStorage.getItem('annote_username'));

    useEffect(() => {
        const x = async () => {
            const dict = await FetchSentence(sid);
            console.log(dict['sentence'], dict['sentId'])
            setSentence(dict['sentence']);
            setSentId(dict['sentId'])
        };
        x();
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
    useEffect(() => {
        if(sentence.length > 0){
            let {sent, links, hashs} = wordArr(sentence);
            // console.log(sent);
            // console.log(links);
            // console.log(hashs);
            setHypertext(links);
            setHashtags(hashs);
        }
    }, [sentence]);

    // useEffect(() => {
    //     console.log(hypertext);
    // }, [hypertext]);

    const [tag, setTag] = useState([{index: 0, key: 'Hello', value: 'e'}]);

    useEffect(() => {
        let resp;
        const getSentence = async (id_prop) => {
            const id = JSON.parse(id_prop);
            const data = {
                id,
                logged_in_user,
            };
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-edit-sentence`, {
                method: "POST",
                headers: {
                    'Content-type': 'application-json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(data)
            });
            // console.log(res.data.result);
            resp = res.data.result[2];
            setSelected(res.data.result[0]);

            console.log(resp);

            setTag(resp);
        };

        const fetchLidData = async () => {
            console.log(resp)

            const lst = [];
            let counter = 0;
            resp.map(elem => lst.push({
                key: elem[0],
                value: elem[1],
                index: counter++,
            }));
            setTag(lst);
        };
        // fetchLidData();
        getSentence(sid);
    }, []);

    useEffect(() => {
        console.log(selected);
    }, [selected]);

    const toggle = letter => {
        if(letter === 'h'){
            return 'e';
        }
        else if (letter === 'e'){
            return 'u';
        } else if(letter === 'u'){
            return 'h';
        }
    };

    // useEffect(() => {
    //     console.log('TAG ARRAY: ', tag);
    // }, [tag]);

    const updateTagForWord = word  => {
        let lst = [...tag];
        lst[word.index] = {
            key: word.key,
            value: toggle(word.value),
            index: word.index,
        }
        console.log('Selected', selected, 'Word_Value: ', toggle(word.value));
        setTag(lst);
        setSelected(selected);
    };

    const onSubmitHandler = async () => {
        const username = JSON.parse(sessionStorage.getItem('annote_username'));
        const date = new Date();
        const endTime = new Date();

        const timeDifference = (endTime.getTime() - startTime.getTime()) / 1000;
        console.log(timeDifference);
        setFeedbackVisible(false);

        const data = {
            selected,
            tag,
            sentId,
            username,
            date,
            hashtags,
            hypertext,
            timeDifference,
        };
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit-edit-sentence`, {
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        });
        console.log(res);
        history('/profile');
    };

    return (
        <StyledContainer>
            <Navbar />
            <StyledGridder>
                <Steps />
                <StyledRightContainer>
                    <StyledSentenceId>#{sentId}</StyledSentenceId>
                    <StyledSentenceContainer>
                        <StyledDisplaySentenceContainer>
                            <StyledSentence>{sentence}</StyledSentence>
                        </StyledDisplaySentenceContainer>
                        <div>
                            <LanguageBtn selected={selected} setSelected={setSelected}/>
                        </div>
                    </StyledSentenceContainer>
                    
                    <div>
                        <StyledWordBreakup>
                            Individual Word Tags
                        </StyledWordBreakup>
                        <StyledFlex>
                            {tag.map((elem, i) => {
                                // console.log(selected, elem.value, selected === (elem.value));
                                return (
                                    <StyledWord
                                        // style={{ backgroundColor: selected === elem.value ? 'green' : 'red' }}
                                        lang={selected} individualTag={elem.value} key={elem.key} onClick={() => updateTagForWord(elem)}>{elem.key}</StyledWord>
                                );
                            })}
                        </StyledFlex>
                        <StyledFlex>
                        <FeedbackLabel htmlFor="feedback" onClick={() => setFeedbackVisible(!feedbackVisible)}>
                            Feedback:
                          </FeedbackLabel>
                          {feedbackVisible && (
                            <textarea
                              id="feedback"
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              placeholder="Enter your feedback here"
                            />
                          )}
                        </StyledFlex> 
                    </div>

                    <StyledSubmitContainer>
                        <StyledButton style={{ width: '100%' }} variant="contained" onClick={onSubmitHandler}>Submit</StyledButton>
                    </StyledSubmitContainer>
                </StyledRightContainer>
            </StyledGridder>
        </StyledContainer>
    );
};

export default Edit;

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
    margin: 15px auto;
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
    margin-top: 0; 
    padding-top: 0;
`;

const StyledSentenceId = styled.div`
    background-color: #efefef;
    border-radius: 12px;
    padding: 12px;
    position: fixed;
    top: 75px;
    right: 20px;
`;

const FeedbackLabel = styled.label`
  display: flex;
  align-items: center;
  align-content: center;
  margin-bottom: 0px;
  font-weight: bold;
  color: #333;
`;