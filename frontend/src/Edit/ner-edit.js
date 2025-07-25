import React, { useEffect, useState }  from 'react';
import { useNavigate } from 'react-router-dom';
import '../NER/NER.css';
import Navbar from '../Components/Navbar';
import { useParams } from 'react-router-dom';

import styled from 'styled-components';
import NERRules from '../NER/NERRules';

import { Button } from '@mui/material';

import axios from 'axios';

const colorData = {
    "PERSON": "#FFD700",  
    "ORGANISATION": "#DC143C",     
    "PLACE": "#FF69B4",  
    "DATE": "#32CD32",
    "TIME": "#FF8C00",
    "GPE": "#8B4513",    
    "HASHTAG": "#708090",
    "MENTION": "#9ACD32",
    "EMOJI": "#FF4500",
    "X": "#6495ED",
};

const nerTags = [
    "PERSON",   
    "ORGANISATION",      
    "PLACE",
    "DATE",
    "TIME",
    "GPE",
    "HASHTAG",
    "MENTION",
    "EMOJI",
    "X",
];

const refineNERData = (data) => {
    const tagMapping = {
        "B-PERSON": "PERSON",
        "I-PERSON": "PERSON",
        "B-ORGANISATION": "ORGANISATION",
        "I-ORGANISATION": "ORGANISATION",
        "B-PLACE": "PLACE",
        "I-PLACE": "PLACE",
        // Add other mappings as needed
    };

    const isHashtag = (word) => /^#\w+/.test(word);
    const isMention = (word) => /^@\w+/.test(word);
    const isDate = (word) => /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2}|\d{4})\b/.test(word);
    const isTime = (word) => /\b\d{1,2}:\d{2}(?:AM|PM|am|pm)?\b/.test(word);

    let refinedData = [];
    data.forEach((element) => {
        // Use the mapped entity if available, otherwise keep the original entity
        let entity = tagMapping[element.entity] || element.entity;

        // Apply additional logic if the entity is missing or marked as "X"
        if (!entity || entity === 'X') {
            if (isHashtag(element.word)) {
                entity = 'HASHTAG';
            } else if (isMention(element.word)) {
                entity = 'MENTION';
            } else if (isDate(element.word)) {
                entity = 'DATE';
            } else if (isTime(element.word)) {
                entity = 'TIME';
            } else {
                entity = 'X';
            }
        }

        refinedData.push({
            word: element.word,
            entity: entity
        });
    });
    return refinedData;
};
const FetchSent = async (id_prop) => {
    const id = JSON.parse(id_prop); // Assuming id_prop is already a JSON-parsed value
    const data = {
        ner_id: id, 
    };
    console.log("fetch NER_id called id: ", id);
    try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/get-n-sentence`, data);
        // console.log("server return:", res.data.result);
        return res.data.result;
    } catch (error) {
        console.error('Error fetching sentence:', error);
        throw error; // Rethrow the error to handle it in the caller function
    }
  };
  
  const FetchSentence = async (id_prop) => {
    const id = JSON.parse(id_prop); 
    const logged_in_user = JSON.parse(sessionStorage.getItem('annote_username'));
    const data = {
        id, 
        logged_in_user
    };
    try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ner-edit-sentence`, data);
        console.log("server return:", res.data.result);
        return res.data.result;
    } catch (error) {
        console.error('Error fetching sentence:', error);
        throw error;
    }
  };

  const NEREDIT =  props => {
    const { nerid } = useParams();
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [data, setData] = useState([]);
    const [ner_id, setner_Id] = useState(nerid);
    const [compress, setCompress] = useState(false);
    const ignoreList = [',', '!', '.', '?'];
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    console.log(ner_id);

    useEffect(() => {
      const x = async () => {
          const dict = await FetchSent(nerid);
          console.log(dict['sentence'])
          setText(dict['sentence']);
      };
      x();
  }, []);

    useEffect(() => {
      const x = async () => {
          const dict = await FetchSentence(nerid);
          if (Array.isArray(dict.ner_tags) && Array.isArray(dict.ner_tags[2])) {
            const tmp = dict.ner_tags[2];
            let dataArr = [];
            tmp.forEach((element, index) => {
              let idx = dataArr.length - 1;
          
              if (idx >= 0 && element.word.includes('#')) {
                let newWord = dataArr[idx].word + element.word;
                newWord = newWord.replaceAll('#', '');
          
                let entity = element.entity;
          
                if (dataArr[idx].entity === tmp[index].entity) {
                  entity = dataArr[idx].entity;
                }
                dataArr.pop();
                dataArr.push({
                  'word': newWord,
                  'entity': entity
                });
              } else {
                dataArr.push({
                  'word': element.word,
                  'entity': element.entity
                });
              }
            });
          
            setData(dataArr);
            setCompress(true);
          } else {
            console.error("Unexpected data type in dict[0][2]");
          }
         
      };
      x();
  }, []);

    const startTime = new Date();

    // data.length > 0 && !compress && dataRefiner();

    const changeNER = (e, index) => {
      const updatedData = [...data];
      updatedData[index].entity = e.target.value;
      setData(updatedData);
    };

    const listItems = data.map(
        (element, index) => {
            return (
            (!ignoreList.includes(element.word) && <StyledFlexOption key={index} index={index} data={data}>
              <div style={{ color: "#fefefe" }}>{element.word}</div>
              <StyledSelect key={index} index={index} data={data} style={{maxHeight: '100%', overflow: 'auto'}} defaultValue={element.entity} onChange={e => changeNER(e, index)}>
                {nerTags.map(ner => (
                    <StyledWord individualTag={ner} key={ner} value={ner}>
                      {ner}
                    </StyledWord> 
                  ))}
              </StyledSelect>
            </StyledFlexOption>)
            ) 
        }
    )

    const onSubmitHandler = async (e, data_) => {
      e.preventDefault();
      console.log('Submitted = ', data_)
      setFeedback('');
      setFeedbackVisible(false);
      const username = JSON.parse(sessionStorage.getItem('annote_username'));
      const date = new Date();
      const endTime = new Date();
      const ner_tag = data_;

      const timeDifference = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log(timeDifference);

      const data = {
        ner_id,
        ner_tag,
        username,
        date,
        timeDifference,
        feedback,
    };
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/submit-ner-edit-sentence`, {
          method: "POST",
          headers: {
              'Content-type': 'application-json',
              'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify(data)
      });
      console.log("res",res);
      navigate('/Profilener');
     
    };

  return (
    <div className="App">
      <Navbar />
      <NERRules />
      <StyledSentenceId>#{nerid}</StyledSentenceId>
      <div className='textAreaBox'>
        <div className='textArea'>{text}</div>
      </div>

      <div className='generatedBox'>
        <h3>Individual NER Tag</h3>
        <StyledFlex>
          {data && listItems}
        </StyledFlex>
        <div>
                  
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
        </div>
        <StyledButton onClick={e => onSubmitHandler(e, data)}>Submit</StyledButton>
      </div>  
    </div>
  );
}

export default NEREDIT;

export const StyledButton = styled(Button)`
    background-color: #502380 !important;
    color: white !important;
    margin-top: 24px;
    font-weight: 500 !important; /* Medium bold */
`;

const StyledFlex = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 6px;
    width: 90%;
    margin: 24px auto;
    flex-wrap: wrap;
`;

const StyledWord = styled.option`
    border-radius: 8px;
    padding: 8px 8px;
    text-align: center;
    color: white;
    background-color: ${props => colorData[props.individualTag]};
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
  background-color: ${props => colorData[props.data[props.index].entity]};
  padding: 10px;
  border-radius: 8px;
`;

const StyledSelect = styled.select`
  background-color: ${props => colorData[props.data[props.index].entity]};
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