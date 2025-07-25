import React, { useEffect, useState } from 'react';
import './Translate.css';
import Navbar from '../Components/Navbar';
import styled from 'styled-components';
import TranslationRules from './TranslateRules';
import { ReactTransliterate } from "react-transliterate";
import "react-transliterate/dist/index.css";
import { StyledButton } from '../utils/styles';
import axios from 'axios';

const Translation = () => {
  const [text, setText] = useState('');
  const [texttrans, setTexttrans] = useState("");
  const [data, setData] = useState([]);
  const [hindiTranslation, setHindiTranslation] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [isDataEmpty, setIsDataEmpty] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const fetchTranslations = async () => {
    const trans_id = JSON.parse(sessionStorage.getItem("trans_id"));
    const data = { 
      trans_id,
    };

    try {
     const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/fetch-translation-sent`,{
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        });
        console.log(res.data.result);

      if (res.data.result.length > 0) {
        setText(res.data.result[0].sentence);
        let tmp = JSON.parse(JSON.stringify(res.data.result[0].RH_tags)); // Romanized Hindi tags
        let tmp1 = JSON.parse(JSON.stringify(res.data.result[0].eng_tags)); // English tags
        let tmp2 = JSON.parse(JSON.stringify(res.data.result[0].DH_tags)); 
        // setData(tmp);
        setHindiTranslation(tmp);
        setEnglishTranslation(tmp1);
        setTexttrans(tmp2); 

        setIsDataEmpty(false); 
      } else {
          setIsDataEmpty(true); 
      }
    } catch (error) {
      console.error("Error fetching translations:", error);
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, []);

  const [compress, setCompress] = useState(false);

  useEffect(() => {
    if (data.length > 0 && !compress) {
        dataRefiner();
    }
  }, [data, compress]);


  const dataRefiner = () => {
    let dataArr = [];
    data.forEach((element, index) => {
        let idx = dataArr.length - 1;

        if (idx >= 0 && element.word.startsWith('##')) {
            let newWord = dataArr[idx].word + element.word.replace('##', '');
            let entity = dataArr[idx].entity;

            dataArr.pop();
            dataArr.push({ 'word': newWord, 'entity': entity });
        } else {
            dataArr.push({ 'word': element.word, 'entity': element.entity });
        }
    });

    setData(dataArr);
    setCompress(true);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const username = JSON.parse(sessionStorage.getItem('annote_username'));
    const date = new Date();
    const startTime = new Date();
    const endTime = new Date();
    const trans_id = parseInt(sessionStorage.getItem('trans_id')) + 1;
    const timeDifference = (endTime.getTime() - startTime.getTime()) / 1000;
    console.log(timeDifference);
    const data = {
      trans_id,
      sentence: text,
      hindiTranslation,
      englishTranslation,
      texttrans,
      username,
      date,
      timeDifference,
      feedback,
    };

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/submit-translation`,
        {
            method: "POST",
            headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        });
      console.log(res);
      sessionStorage.setItem('trans_id', trans_id);
      window.location.reload();
    } catch (error) {
      console.error("Error submitting translation:", error);
    }
  };

  return (
    <div className="App">
      <Navbar />
      <StyledContentWrapper>
        <StyledLeftBox>
          <TranslationRules />
        </StyledLeftBox>

        <StyledRightBox>
          {isDataEmpty ? (
            <div className="Box">
              You are done with all the translations. Please ask the administrator to upload the next set of sentences.
            </div>
          ) : (
            <>
              <StyledTranslationId>#{JSON.parse(sessionStorage.getItem("trans_id")) + 1}</StyledTranslationId>

              <div className='textAreaBox'>
                  <div className='textArea'>{text}</div>
              
                  <div>
                    <Label>English Translation:</Label>
                    <StyledTextArea
                      value={englishTranslation}
                      rows={4}
                      onChange={(e) => setEnglishTranslation(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Romanized Hindi Translation:</Label>
                    <StyledTextArea
                      value={hindiTranslation}
                      rows={4}
                      onChange={(e) => setHindiTranslation(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Devnagari Hindi Translation:</Label>
                    <ReactTransliterate
                    className="translateBox" 
                    value={texttrans}
                    onChangeText={(text) => {
                      setTexttrans(text);
                    }}
                    lang="hi"
                  />
                  </div>

                  <FeedbackLabel onClick={() => setFeedbackVisible(!feedbackVisible)}>
                    Feedback:
                  </FeedbackLabel>
                  {feedbackVisible && (
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter your feedback here"
                    />
              )}
                  {/* <StyledSubmitContainer>
                  <StyledButton style={{ width: '100%' }} variant="contained" onClick={onSubmitHandler}>Submit</StyledButton>
                  </StyledSubmitContainer> */}
                   <StyledSubmitContainer>
                        <StyledButton style={{ width: '100%' }} variant="contained" onClick={onSubmitHandler}>Submit</StyledButton>
                    </StyledSubmitContainer>
              </div>
            </>
          )}
        </StyledRightBox>
      </StyledContentWrapper>
    </div>
  );
};

export default Translation;

const StyledTextArea = styled.textarea`
    width: 100%;
    margin-top: 10px;
    font-size: 20px;
    color: #333;
    resize: none;
    height: 40px;
    font-family: "Arial", sans-serif; 
    padding: 10px;
    justify-content: center;
    width: 850px;
    
`;

const StyledTranslationId = styled.div`
  background-color: #efefef;
  border-radius: 12px;
  padding: 12px;
  position: fixed;
  top: 75px;
  right: 20px;
`;

const FeedbackLabel = styled.label`
  display: block;
  margin-bottom: 10px;
  margin-top: 10px;
  font-weight: bold;
  color: #333;
`;

const StyledContentWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
`;

const StyledSubmitContainer = styled.div`
    width: 20%;
    text-align: center;
    margin: 0px auto;
`;

const StyledLeftBox = styled.div`
  width: 20%;
  padding: 20px;
`;

const StyledRightBox = styled.div`
  width: 75%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Label = styled.div`
  display: block;  
  text-align: center; 
  font-weight: bold;
`;