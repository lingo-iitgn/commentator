import React, { useEffect, useState }  from 'react';
import { useNavigate } from 'react-router-dom';
import '../Translate/Translate.css';
import Navbar from '../Components/Navbar';
import { useParams } from 'react-router-dom';
import { ReactTransliterate } from "react-transliterate";

import styled from 'styled-components';
import TranslationRules from '../Translate/TranslateRules';

import { Button } from '@mui/material';

import axios from 'axios';


const fetchTranslateData = async (id_prop) => {
  const id = JSON.parse(id_prop);
  const logged_in_user = JSON.parse(sessionStorage.getItem('annote_username'));
  const data = {
      trans_id: id,
      logged_in_user
  };

  try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/trans-edit-sentence`, data);
      console.log("server return:", res.data.result);
      return res.data.result;
  } catch (error) {
      console.error('Error fetching sentence and NER tags:', error);
      throw error;
  }
};

  const TRANSLATEEDIT =  props => {
    const { transid } = useParams();
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [texttrans, setTexttrans] = useState("");
    const [data, setData] = useState([]);
    const [trans_id, settrans_id] = useState(transid);
    const [isDataEmpty, setIsDataEmpty] = useState(false);
    const [hindiTranslation, setHindiTranslation] = useState('');
    const [englishTranslation, setEnglishTranslation] = useState('');
    const ignoreList = [',', '!', '.', '?'];
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    console.log(trans_id);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const dict = await fetchTranslateData(trans_id);
    
            if (dict) {
              console.log(dict.sentence);
    
              // Set state variables with fetched data
              setText(dict.sentence || '');
              setHindiTranslation(dict.RH_tags || []);
              setEnglishTranslation(dict.eng_tags || []);
              setTexttrans(dict.DH_tags);
              settrans_id(dict['trans_id']);
    
              setIsDataEmpty(false);
            } else {
              setIsDataEmpty(true);
            }
          } catch (error) {
            console.error('Error in fetching translate data:', error);
          }
        };
    
        fetchData();
      }, [trans_id]);
    

    const startTime = new Date();

 
    const changeTrans = (e, index) => {
        const updatedData = [...data];
        updatedData[index].entity = e.target.value;
        setData(updatedData);
      };
      
      const listItems = data.map((element, index) => {
        return (
          !ignoreList.includes(element.word) && (
            <StyledFlexOption key={index} index={index} data={data}>
              <div style={{ color: "#fefefe" }}>{element.word}</div>
              <StyledSelect
                key={index}
                index={index}
                data={data}
                style={{ maxHeight: '100%', overflow: 'auto' }}
                defaultValue={element.entity}
                onChange={(e) => changeTrans(e, index)}
              >
                {/* {transTags.map((ner) => (
                  <StyledWord individualTag={ner} key={ner} value={ner}>
                    {ner}
                  </StyledWord>
                ))} */}
              </StyledSelect>
            </StyledFlexOption>
          )
        );
      });
      
      const onSubmitHandler = async (e) => {
        e.preventDefault();
      
        const username = JSON.parse(sessionStorage.getItem('annote_username'));
        const date = new Date();
        const endTime = new Date();
        const startTime = new Date(); // Include if needed
        // const trans_id = parseInt(sessionStorage.getItem('trans_id')) + 1;
        const timeDifference = (endTime.getTime() - startTime.getTime()) / 1000;
            
        const submissionData = {
          trans_id,
          sentence: text,
          englishTranslation, 
          hindiTranslation, 
          texttrans, 
          username,
          date,
          timeDifference,
          feedback,
        };
      
        try {
          const res = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/submit-edit-translation`,
            {
              method: "POST",
              headers: {
                'Content-type': 'application-json',
                'Access-Control-Allow-Origin': '*',
              },
              body: JSON.stringify(submissionData),
            }
          );
      
          console.log(res);
          navigate('/Profiletranslate');
          // sessionStorage.setItem('trans_id', trans_id); // Update session storage for new trans_id
          // window.location.reload();
        } catch (error) {
          console.error("Error submitting Trans edit and translation:", error);
        }
      };
      
      return (
        <div className="App">
          <Navbar />
          <TranslationRules />
          <StyledSentenceId>#{trans_id}</StyledSentenceId>
      
          <div className='textAreaBox'>
                  <div className='textArea'>{text}</div>
              
                  <div className="transliterateBox">
                    <Label>English Translation:</Label>
                    <StyledTextArea
                      value={englishTranslation}
                      rows={4}
                      onChange={(e) => setEnglishTranslation(e.target.value)}
                    />
                  </div>

                  <div className="transliterateBox">
                    <Label>Romanized Hindi Translation:</Label>
                    <StyledTextArea
                      value={hindiTranslation}
                      rows={4}
                      onChange={(e) => setHindiTranslation(e.target.value)}
                    />
                  </div>

                  <div className="transliterateBox">
                    <Label>Devnagari Hindi Translation:</Label>
                    <ReactTransliterate
                    className="translate-input" 
                    value={texttrans}
                    onChangeText={(text) => {
                      setTexttrans(text);
                    }}
                    lang="hi"
                  />
                  </div>
      
            <div>
              <FeedbackLabel
                htmlFor="feedback"
                onClick={() => setFeedbackVisible(!feedbackVisible)}
              >
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
            </div>
      
            <StyledSubmitContainer>
              <StyledButton
                style={{ width: "100%" }}
                variant="contained"
                onClick={onSubmitHandler}
              >
                Submit
              </StyledButton>
            </StyledSubmitContainer>
          </div>
        </div>
      );
      
}

export default TRANSLATEEDIT;

export const StyledButton = styled(Button)`
    background-color: #502380 !important;
    color: white !important;
    margin-top: 24px;
    font-weight: 500 !important; /* Medium bold */
`;

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
const StyledWord = styled.option`
    border-radius: 8px;
    padding: 8px 8px;
    text-align: center;
    color: white;
    cursor: pointer;
    display: flex;
    flex: 0 1 10%;
    min-width: 70px;
    justify-content: center;
`;

const StyledFlexOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 10px;
  border-radius: 8px;
`;

const StyledSelect = styled.select`
  border: 0;
  color: #fefefe !important;
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
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
`;

const StyledSubmitContainer = styled.div`
    width: 20%;
    text-align: center;
    margin: 0px auto;
`;

const Label = styled.div`
  display: block;  
  text-align: center; 
  font-weight: bold;
`;